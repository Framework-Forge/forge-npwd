import { v4 as uuidv4 } from 'uuid';
import { config } from '@forge-npwd/config/server';
import { ForgeNPWDMetadataV1 } from '../devices/device.interfaces';
import { DeviceRepo } from '../devices/device.database';
import { ForgeNPWDDeviceService } from '../devices/device.service';
import PlayerService from '../players/player.service';
import { PhoneSecurityService } from '../security/security.service';
import { generateUniquePhoneNumber } from '../misc/generateUniquePhoneNumber';
import { OwnedPhoneDevice, RecoveryResult } from '@typings/recovery';
import { RecoveryRepo, RecoveryRepository } from './recovery.database';

const RESOURCE_NAME = GetCurrentResourceName();
const MAX_NUMBER_ATTEMPTS = 10;

interface InventoryResult {
  success: boolean;
  error?: string;
}

export class RecoveryService {
  constructor(private readonly repository: RecoveryRepository = RecoveryRepo) {}

  private ownerForSource(source: number): string | null {
    return PlayerService.getPlayer(source)?.getIdentifier() || null;
  }

  async listOwned(source: number): Promise<OwnedPhoneDevice[]> {
    await DeviceRepo.ensureSchema();
    const owner = this.ownerForSource(source);
    return owner ? this.repository.listByOwner(owner) : [];
  }

  async cancelLostPhone(source: number, deviceId: string): Promise<RecoveryResult> {
    const owner = this.ownerForSource(source);
    if (!owner) return { success: false, error: 'PLAYER_NOT_LOADED' };
    if (!deviceId || typeof deviceId !== 'string') return { success: false, error: 'INVALID_DEVICE_ID' };
    const blocked = await ForgeNPWDDeviceService.blockDevice(deviceId, owner);
    return blocked
      ? { success: true, oldDeviceId: deviceId }
      : { success: false, error: 'DEVICE_NOT_FOUND_OR_NOT_OWNED' };
  }

  async issueNewPhone(source: number, model?: string, color?: string, slot?: number): Promise<RecoveryResult> {
    await DeviceRepo.ensureSchema();
    const owner = this.ownerForSource(source);
    if (!owner) return { success: false, error: 'PLAYER_NOT_LOADED' };

    const safeModel = this.safeDeviceValue(model, config.device.defaultModel, 32);
    const safeColor = this.safeDeviceValue(color, config.device.defaultColor, 24);
    const connection = await this.repository.getConnection();

    try {
      for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS; attempt += 1) {
        let metadata: Record<string, unknown> | null = null;
        let itemAdded = false;
        let committed = false;

        try {
          await connection.beginTransaction();
          const identity: ForgeNPWDMetadataV1 = {
            deviceId: uuidv4(),
            profileId: uuidv4(),
            lineId: uuidv4(),
            serialNumber: `FP-${uuidv4().replace(/-/g, '').slice(0, 20).toUpperCase()}`,
            phoneNumber: await generateUniquePhoneNumber(),
            model: safeModel,
            color: safeColor,
            schemaVersion: config.device.metadataSchemaVersion,
          };
          metadata = { forgeForgeNpwd: identity };

          await connection.execute(
            'INSERT INTO forge_phone_profiles (profile_id, settings) VALUES (?, ?)',
            [identity.profileId, JSON.stringify({ home: { pageCount: 1, pages: [[]], widgets: [] } })],
          );
          await connection.execute(
            `INSERT INTO forge_phone_lines (line_id, profile_id, phone_number, status)
             VALUES (?, ?, ?, 'active')`,
            [identity.lineId, identity.profileId, identity.phoneNumber],
          );
          await connection.execute(
            `INSERT INTO forge_phone_devices
              (device_id, profile_id, serial_number, registered_owner_citizenid,
               current_user_citizenid, model, color, schema_version, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [
              identity.deviceId,
              identity.profileId,
              identity.serialNumber,
              owner,
              owner,
              identity.model,
              identity.color,
              identity.schemaVersion,
            ],
          );

          const inventoryResult = global.exports[RESOURCE_NAME].addForgeNPWDItem(
            source,
            metadata,
            Number.isInteger(slot) ? slot : null,
          ) as InventoryResult;
          if (!inventoryResult?.success) {
            await connection.rollback();
            return { success: false, error: inventoryResult?.error || 'INVENTORY_ADD_FAILED' };
          }
          itemAdded = true;

          try {
            await connection.commit();
            committed = true;
          } catch (error) {
            global.exports[RESOURCE_NAME].removeForgeNPWDItem(source, metadata);
            itemAdded = false;
            throw error;
          }

          await DeviceRepo.mirrorLegacyPhoneNumber(owner, identity.phoneNumber).catch(() => undefined);
          return {
            success: true,
            newDeviceId: identity.deviceId,
            serialNumber: identity.serialNumber,
            phoneNumber: identity.phoneNumber,
            profileId: identity.profileId,
            lineId: identity.lineId,
          };
        } catch (error) {
          if (!committed) await connection.rollback();
          if (!committed && itemAdded && metadata) {
            global.exports[RESOURCE_NAME].removeForgeNPWDItem(source, metadata);
          }
          const databaseError = error as { code?: string };
          if (databaseError.code === 'ER_DUP_ENTRY' && attempt < MAX_NUMBER_ATTEMPTS - 1) continue;
          throw error;
        }
      }
      return { success: false, error: 'PHONE_NUMBER_GENERATION_FAILED' };
    } finally {
      connection.release();
    }
  }

  async issueReplacement(source: number, oldDeviceId: string, slot?: number): Promise<RecoveryResult> {
    await DeviceRepo.ensureSchema();
    const owner = this.ownerForSource(source);
    if (!owner) return { success: false, error: 'PLAYER_NOT_LOADED' };
    if (!oldDeviceId || typeof oldDeviceId !== 'string') {
      return { success: false, error: 'INVALID_DEVICE_ID' };
    }

    const connection = await this.repository.getConnection();
    let metadata: Record<string, unknown> | null = null;
    let itemAdded = false;
    let committed = false;
    try {
      await connection.beginTransaction();
      const old = await this.repository.findForUpdate(connection, oldDeviceId);
      if (!old || old.registered_owner_citizenid !== owner) {
        await connection.rollback();
        return { success: false, error: 'DEVICE_NOT_FOUND_OR_NOT_OWNED' };
      }
      if (old.status !== 'blocked') {
        await connection.rollback();
        return { success: false, error: old.status === 'replaced' ? 'DEVICE_ALREADY_REPLACED' : 'DEVICE_MUST_BE_BLOCKED' };
      }

      const deviceId = uuidv4();
      const serialNumber = `FP-${uuidv4().replace(/-/g, '').slice(0, 20).toUpperCase()}`;
      const identity: ForgeNPWDMetadataV1 = {
        deviceId,
        profileId: old.profile_id,
        lineId: old.line_id,
        serialNumber,
        phoneNumber: old.phone_number,
        model: old.model || config.device.defaultModel,
        color: old.color || config.device.defaultColor,
        schemaVersion: old.schema_version,
      };
      metadata = { forgeForgeNpwd: identity };

      await connection.execute(
        `INSERT INTO forge_phone_devices
          (device_id, profile_id, serial_number, registered_owner_citizenid,
           current_user_citizenid, pin_hash, pin_salt, pin_length, pin_fail_count,
           pin_locked_until, pin_updated_at, model, color, schema_version, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, ?, ?, 'active')`,
        [
          deviceId,
          old.profile_id,
          serialNumber,
          owner,
          owner,
          old.pin_hash,
          old.pin_salt,
          old.pin_length,
          old.pin_updated_at,
          identity.model,
          identity.color,
          identity.schemaVersion,
        ],
      );
      await connection.execute(
        `UPDATE forge_phone_devices
            SET status = 'replaced', current_user_citizenid = NULL,
                blocked_at = COALESCE(blocked_at, CURRENT_TIMESTAMP),
                replaced_by_device_id = ?
          WHERE device_id = ?`,
        [deviceId, oldDeviceId],
      );

      const inventoryResult = global.exports[RESOURCE_NAME].addForgeNPWDItem(
        source,
        metadata,
        Number.isInteger(slot) ? slot : null,
      ) as InventoryResult;
      if (!inventoryResult?.success) {
        await connection.rollback();
        return { success: false, error: inventoryResult?.error || 'INVENTORY_ADD_FAILED' };
      }
      itemAdded = true;

      try {
        await connection.commit();
        committed = true;
      } catch (error) {
        global.exports[RESOURCE_NAME].removeForgeNPWDItem(source, metadata);
        itemAdded = false;
        throw error;
      }

      PhoneSecurityService.lockDevice(oldDeviceId);
      for (const activeSource of PlayerService.revokeActiveDevice(oldDeviceId)) {
        emitNet('forge-npwd:client:deviceBlocked', activeSource);
      }
      await DeviceRepo.mirrorLegacyPhoneNumber(owner, old.phone_number).catch(() => undefined);
      return {
        success: true,
        oldDeviceId,
        newDeviceId: deviceId,
        serialNumber,
        phoneNumber: old.phone_number,
        profileId: old.profile_id,
        lineId: old.line_id,
      };
    } catch (error) {
      if (!committed) await connection.rollback();
      if (!committed && itemAdded && metadata) {
        global.exports[RESOURCE_NAME].removeForgeNPWDItem(source, metadata);
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  private safeDeviceValue(value: string | undefined, fallback: string, maxLength: number): string {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim();
    return /^[a-zA-Z0-9_-]+$/.test(normalized) && normalized.length <= maxLength ? normalized : fallback;
  }
}

export const PhoneRecoveryService = new RecoveryService();
