import { v4 as uuidv4 } from 'uuid';
import { config } from '@forge-npwd/config/server';
import { PhoneEvents } from '@typings/phone';
import { generateUniquePhoneNumber } from '../misc/generateUniquePhoneNumber';
import PlayerService from '../players/player.service';
import { mainLogger } from '../sv_logger';
import { DeviceRepo, DeviceRepository } from './device.database';
import { PhoneSecurityService } from '../security/security.service';
import {
  CreateDeviceIdentity,
  DeviceIdentity,
  ForgeNPWDMetadataV1,
  PhoneItemData,
} from './device.interfaces';

const deviceLogger = mainLogger.child({ module: 'ForgePhoneDevice' });
const RESOURCE_NAME = GetCurrentResourceName();
const MAX_NUMBER_ATTEMPTS = 10;

const isMetadataV1 = (value: unknown): value is ForgeNPWDMetadataV1 => {
  if (!value || typeof value !== 'object') return false;
  const metadata = value as Record<string, unknown>;
  return (
    typeof metadata.deviceId === 'string' &&
    typeof metadata.profileId === 'string' &&
    typeof metadata.lineId === 'string' &&
    typeof metadata.serialNumber === 'string' &&
    typeof metadata.phoneNumber === 'string' &&
    typeof metadata.model === 'string' &&
    typeof metadata.color === 'string' &&
    typeof metadata.schemaVersion === 'number'
  );
};

const publicMetadata = (identity: DeviceIdentity | CreateDeviceIdentity): ForgeNPWDMetadataV1 => ({
  deviceId: identity.deviceId,
  profileId: identity.profileId,
  lineId: identity.lineId,
  serialNumber: identity.serialNumber,
  phoneNumber: identity.phoneNumber,
  model: identity.model,
  color: identity.color,
  schemaVersion: identity.schemaVersion,
});

export class DeviceService {
  private readonly pending = new Map<string, Promise<DeviceIdentity>>();

  constructor(private readonly repository: DeviceRepository = DeviceRepo) {}

  async usePhoneItem(source: number, item: PhoneItemData): Promise<DeviceIdentity> {
    if (!config.device.enabled) throw new Error('Forge NPWD device mode is disabled');
    if (!item || item.name !== config.device.itemName || !Number.isInteger(item.slot)) {
      throw new Error('Invalid phone item payload');
    }
    await this.repository.ensureSchema();

    const key = `${source}:${item.slot}`;
    const inFlight = this.pending.get(key);
    if (inFlight) return inFlight;

    const operation = this.provisionAndActivate(source, item).finally(() => this.pending.delete(key));
    this.pending.set(key, operation);
    return operation;
  }

  private async provisionAndActivate(source: number, item: PhoneItemData): Promise<DeviceIdentity> {
    const player = PlayerService.getPlayer(source);
    if (!player) throw new Error(`Player ${source} is not loaded`);

    const container = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
    const stored = (container as Record<string, unknown>).forgeForgeNpwd;
    let identity = isMetadataV1(stored)
      ? await this.repository.findByDeviceId(stored.deviceId)
      : null;

    if (!identity) {
      identity = await this.createIdentity(source, item, player.getIdentifier(), container, stored);
    } else {
      await this.writeMetadata(source, item.slot, container, publicMetadata(identity));
    }

    if (identity.status !== 'active') {
      throw new Error(`Device ${identity.deviceId} is ${identity.status}`);
    }

    await Promise.all([
      this.repository.activate(identity.deviceId, player.getIdentifier()),
      this.repository.mirrorLegacyPhoneNumber(
        identity.registeredOwnerCitizenId,
        identity.phoneNumber,
      ),
    ]);
    identity.currentUserCitizenId = player.getIdentifier();
    player.setActiveDevice(
      identity.deviceId,
      identity.profileId,
      identity.phoneNumber,
      identity.registeredOwnerCitizenId,
    );
    PhoneSecurityService.lockSource(source);

    emitNet(
      PhoneEvents.SEND_CREDENTIALS,
      source,
      identity.phoneNumber,
      source,
      identity.registeredOwnerCitizenId,
    );
    emitNet('forge-npwd:client:open', source);
    console.log(
      `[Forge NPWD] Device ${identity.deviceId} activated for source ${source} with number ${identity.phoneNumber}`,
    );
    return identity;
  }

  private async createIdentity(
    source: number,
    item: PhoneItemData,
    ownerCitizenId: string,
    container: Record<string, unknown>,
    stored: unknown,
  ): Promise<DeviceIdentity> {
    let reusable = isMetadataV1(stored) ? stored : null;

    for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS; attempt += 1) {
      const seed: CreateDeviceIdentity = {
        deviceId: reusable?.deviceId || uuidv4(),
        profileId: reusable?.profileId || uuidv4(),
        lineId: reusable?.lineId || uuidv4(),
        serialNumber: reusable?.serialNumber || `FP-${uuidv4().replace(/-/g, '').slice(0, 20).toUpperCase()}`,
        phoneNumber: reusable?.phoneNumber || (await generateUniquePhoneNumber()),
        model: reusable?.model || config.device.defaultModel,
        color: reusable?.color || config.device.defaultColor,
        schemaVersion: config.device.metadataSchemaVersion,
        registeredOwnerCitizenId: ownerCitizenId,
      };

      await this.writeMetadata(source, item.slot, container, publicMetadata(seed));

      try {
        return await this.repository.create(seed);
      } catch (error) {
        const databaseError = error as { code?: string };
        if (databaseError.code !== 'ER_DUP_ENTRY') throw error;
        reusable = { ...seed, phoneNumber: await generateUniquePhoneNumber() };
        if (attempt === MAX_NUMBER_ATTEMPTS - 1) throw error;
      }
    }

    throw new Error('Unable to provision a unique Forge NPWD identity');
  }

  private async writeMetadata(
    source: number,
    slot: number,
    existing: Record<string, unknown>,
    forgeForgeNpwd: ForgeNPWDMetadataV1,
  ): Promise<void> {
    const metadata = { ...existing, forgeForgeNpwd };
    const success = await Promise.resolve(
      global.exports[RESOURCE_NAME].setForgeNPWDMetadata(source, slot, metadata),
    );
    if (!success) throw new Error(`Unable to update metadata for phone slot ${slot}`);
  }

  async blockDevice(deviceId: string, registeredOwnerCitizenId: string): Promise<boolean> {
    await this.repository.ensureSchema();
    const device = await this.repository.findByDeviceId(deviceId);
    if (!device || device.registeredOwnerCitizenId !== registeredOwnerCitizenId) return false;
    if (device.status === 'replaced') return false;
    if (device.status === 'blocked') return true;
    const blocked = await this.repository.setStatus(deviceId, 'blocked');
    if (!blocked) return false;
    PhoneSecurityService.lockDevice(deviceId);

    for (const source of PlayerService.revokeActiveDevice(deviceId)) {
      emitNet('forge-npwd:client:deviceBlocked', source);
    }
    return true;
  }

  async getDevice(deviceId: string): Promise<DeviceIdentity | null> {
    await this.repository.ensureSchema();
    return this.repository.findByDeviceId(deviceId);
  }
}

export const ForgeNPWDDeviceService = new DeviceService();

on('onServerResourceStart', (resource: string) => {
  if (resource !== RESOURCE_NAME) return;
  DeviceRepo.ensureSchema().catch((error) => {
    deviceLogger.error(`Forge NPWD device schema migration failed: ${error.message}`);
  });
});

on('forge-npwd:server:useDevice', (source: number, item: PhoneItemData) => {
  ForgeNPWDDeviceService.usePhoneItem(source, item).catch((error) => {
    deviceLogger.error(`Phone item activation failed for source ${source}: ${error.message}`);
  });
});

const exp = global.exports;
exp('getDevice', (deviceId: string) => ForgeNPWDDeviceService.getDevice(deviceId));
exp('getActivePhoneContext', (source: number) => {
  const player = PlayerService.getPlayer(Number(source));
  const deviceId = player?.getActiveDeviceId();
  const ownerIdentifier = player?.getActiveOwnerIdentifier();
  if (!player || !deviceId || !ownerIdentifier) return null;
  return {
    deviceId,
    profileId: player.getActiveProfileId(),
    phoneNumber: player.getPhoneNumber(),
    ownerIdentifier,
    holderIdentifier: player.getIdentifier(),
  };
});
exp('blockDevice', (deviceId: string, ownerCitizenId: string) =>
  ForgeNPWDDeviceService.blockDevice(deviceId, ownerCitizenId),
);
