import { pool } from '@forge-npwd/database';
import { RowDataPacket } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { OwnedPhoneDevice } from '@typings/recovery';

export interface RecoverableDeviceRow extends RowDataPacket {
  device_id: string;
  profile_id: string;
  line_id: string;
  serial_number: string;
  phone_number: string;
  registered_owner_citizenid: string;
  current_user_citizenid: string | null;
  model: string;
  color: string;
  schema_version: number;
  status: 'active' | 'blocked' | 'replaced';
  replaced_by_device_id: string | null;
  pin_hash: string | null;
  pin_salt: string | null;
  pin_length: number | null;
  pin_updated_at: Date | null;
}

const RECOVERY_SELECT = `
  SELECT d.device_id, d.profile_id, l.line_id, d.serial_number, l.phone_number,
         d.registered_owner_citizenid, d.current_user_citizenid, d.model, d.color,
         d.schema_version, d.status, d.replaced_by_device_id, d.pin_hash, d.pin_salt,
         d.pin_length, d.pin_updated_at
    FROM forge_phone_devices d
    JOIN forge_phone_lines l ON l.profile_id = d.profile_id AND l.status = 'active'
`;

const toSummary = (row: RecoverableDeviceRow): OwnedPhoneDevice => ({
  deviceId: row.device_id,
  serialNumber: row.serial_number,
  phoneNumber: row.phone_number,
  model: row.model,
  color: row.color,
  status: row.status,
  currentUserCitizenId: row.current_user_citizenid,
  replacedByDeviceId: row.replaced_by_device_id,
});

export class RecoveryRepository {
  async listByOwner(ownerCitizenId: string): Promise<OwnedPhoneDevice[]> {
    const [rows] = await pool.execute<RecoverableDeviceRow[]>(
      `${RECOVERY_SELECT}
        WHERE d.registered_owner_citizenid = ?
        ORDER BY d.created_at DESC`,
      [ownerCitizenId],
    );
    return rows.map(toSummary);
  }

  async findForUpdate(connection: PoolConnection, deviceId: string): Promise<RecoverableDeviceRow | null> {
    const [rows] = await connection.execute<RecoverableDeviceRow[]>(
      `${RECOVERY_SELECT} WHERE d.device_id = ? LIMIT 1 FOR UPDATE`,
      [deviceId],
    );
    return rows[0] || null;
  }

  getConnection() {
    return pool.getConnection();
  }
}

export const RecoveryRepo = new RecoveryRepository();
