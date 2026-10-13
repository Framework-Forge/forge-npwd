import { pool } from '@forge-npwd/database';
import { config } from '@forge-npwd/config/server';
import { RowDataPacket } from 'mysql2';
import { CreateDeviceIdentity, DeviceIdentity, DeviceStatus } from './device.interfaces';

interface DeviceRow extends RowDataPacket {
  device_id: string;
  profile_id: string;
  line_id: string;
  serial_number: string;
  phone_number: string;
  model: string;
  color: string;
  schema_version: number;
  registered_owner_citizenid: string;
  current_user_citizenid: string | null;
  status: DeviceStatus;
}

const mapRow = (row: DeviceRow): DeviceIdentity => ({
  deviceId: row.device_id,
  profileId: row.profile_id,
  lineId: row.line_id,
  serialNumber: row.serial_number,
  phoneNumber: row.phone_number,
  model: row.model,
  color: row.color,
  schemaVersion: row.schema_version,
  registeredOwnerCitizenId: row.registered_owner_citizenid,
  currentUserCitizenId: row.current_user_citizenid,
  status: row.status,
});

const DEVICE_SELECT = `
  SELECT d.device_id, d.profile_id, l.line_id, d.serial_number, l.phone_number,
         d.model, d.color, d.schema_version, d.registered_owner_citizenid,
         d.current_user_citizenid, d.status
    FROM forge_phone_devices d
    JOIN forge_phone_lines l ON l.profile_id = d.profile_id AND l.status = 'active'
`;

export class DeviceRepository {
  private schemaReady: Promise<void> | null = null;

  ensureSchema(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.applyDeviceMigrations().catch((error) => {
        this.schemaReady = null;
        throw error;
      });
    }
    return this.schemaReady;
  }

  private async applyDeviceMigrations(): Promise<void> {
    const [columns] = await pool.execute<RowDataPacket[]>(
      `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'forge_phone_devices'
          AND COLUMN_NAME IN (
            'current_user_citizenid', 'pin_hash', 'pin_salt', 'pin_length', 'pin_fail_count',
            'pin_locked_until', 'pin_updated_at'
          )`,
    );
    const existing = new Set(columns.map((column) => String(column.COLUMN_NAME)));
    const migrations: Array<[string, string]> = [
      ['current_user_citizenid', 'varchar(50) NULL DEFAULT NULL AFTER registered_owner_citizenid'],
      ['pin_hash', 'varchar(128) NULL DEFAULT NULL AFTER current_user_citizenid'],
      ['pin_salt', 'varchar(64) NULL DEFAULT NULL AFTER pin_hash'],
      ['pin_length', 'tinyint unsigned NULL DEFAULT NULL AFTER pin_salt'],
      ['pin_fail_count', 'smallint unsigned NOT NULL DEFAULT 0 AFTER pin_length'],
      ['pin_locked_until', 'timestamp NULL DEFAULT NULL AFTER pin_fail_count'],
      ['pin_updated_at', 'timestamp NULL DEFAULT NULL AFTER pin_locked_until'],
    ];
    for (const [column, definition] of migrations) {
      if (!existing.has(column)) {
        await pool.execute(`ALTER TABLE forge_phone_devices ADD COLUMN ${column} ${definition}`);
      }
    }
    if (!existing.has('pin_length')) {
      await pool.execute(
        `UPDATE forge_phone_devices
            SET pin_length = 4
          WHERE pin_hash IS NOT NULL AND pin_length IS NULL`,
      );
    }

    const [indexes] = await pool.execute<RowDataPacket[]>(
      `SELECT 1
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'forge_phone_devices'
          AND INDEX_NAME = 'idx_forge_phone_devices_current_user'
        LIMIT 1`,
    );
    if (!indexes[0]) {
      await pool.execute(
        `CREATE INDEX idx_forge_phone_devices_current_user
            ON forge_phone_devices (current_user_citizenid)`,
      );
    }
  }

  async findByDeviceId(deviceId: string): Promise<DeviceIdentity | null> {
    const [rows] = await pool.execute<DeviceRow[]>(`${DEVICE_SELECT} WHERE d.device_id = ? LIMIT 1`, [
      deviceId,
    ]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(identity: CreateDeviceIdentity): Promise<DeviceIdentity> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.execute<DeviceRow[]>(
        `${DEVICE_SELECT} WHERE d.device_id = ? LIMIT 1 FOR UPDATE`,
        [identity.deviceId],
      );
      if (existing[0]) {
        await connection.commit();
        return mapRow(existing[0]);
      }

      await connection.execute(
        `INSERT INTO forge_phone_profiles (profile_id, settings) VALUES (?, ?)`,
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
          identity.registeredOwnerCitizenId,
          identity.registeredOwnerCitizenId,
          identity.model,
          identity.color,
          identity.schemaVersion,
        ],
      );

      await connection.commit();
      return {
        ...identity,
        currentUserCitizenId: identity.registeredOwnerCitizenId,
        status: 'active',
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async activate(deviceId: string, currentUserCitizenId: string): Promise<void> {
    await pool.execute(
      `UPDATE forge_phone_devices
          SET current_user_citizenid = ?, last_activated_at = CURRENT_TIMESTAMP
        WHERE device_id = ?`,
      [currentUserCitizenId, deviceId],
    );
  }

  async setStatus(deviceId: string, status: DeviceStatus): Promise<boolean> {
    const blockedAt = status === 'blocked' ? new Date() : null;
    const [result] = await pool.execute(
      `UPDATE forge_phone_devices
          SET status = ?, blocked_at = ?,
              current_user_citizenid = CASE WHEN ? = 'active' THEN current_user_citizenid ELSE NULL END
        WHERE device_id = ?`,
      [status, blockedAt, status, deviceId],
    );
    return (result as { affectedRows: number }).affectedRows > 0;
  }

  async mirrorLegacyPhoneNumber(citizenId: string, phoneNumber: string): Promise<void> {
    if (!config.device.mirrorLegacyPhoneNumber) return;
    const playerTable = config.database.playerTable.replace(/[^a-zA-Z0-9_]/g, '');
    const identifierColumn = config.database.identifierColumn.replace(/[^a-zA-Z0-9_]/g, '');
    const phoneColumn = config.database.phoneNumberColumn.replace(/[^a-zA-Z0-9_]/g, '');
    await pool.execute(`UPDATE \`${playerTable}\` SET \`${phoneColumn}\` = ? WHERE \`${identifierColumn}\` = ?`, [
      phoneNumber,
      citizenId,
    ]);
  }
}

export const DeviceRepo = new DeviceRepository();
