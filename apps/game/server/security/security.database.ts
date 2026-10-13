import { pool } from '@forge-npwd/database';
import { RowDataPacket } from 'mysql2';

export interface PhoneSecurityRecord {
  pinHash: string | null;
  pinSalt: string | null;
  pinLength: number | null;
  failCount: number;
  lockedUntil: Date | null;
}

interface SecurityRow extends RowDataPacket {
  pin_hash: string | null;
  pin_salt: string | null;
  pin_length: number | null;
  pin_fail_count: number;
  pin_locked_until: Date | null;
}

const mapRow = (row: SecurityRow): PhoneSecurityRecord => ({
  pinHash: row.pin_hash,
  pinSalt: row.pin_salt,
  pinLength: row.pin_length ? Number(row.pin_length) : null,
  failCount: Number(row.pin_fail_count) || 0,
  lockedUntil: row.pin_locked_until ? new Date(row.pin_locked_until) : null,
});

export class SecurityRepository {
  async get(deviceId: string): Promise<PhoneSecurityRecord | null> {
    const [rows] = await pool.execute<SecurityRow[]>(
      `SELECT pin_hash, pin_salt, pin_length, pin_fail_count, pin_locked_until
         FROM forge_phone_devices
        WHERE device_id = ?
        LIMIT 1`,
      [deviceId],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async setPin(deviceId: string, pinHash: string, pinSalt: string, pinLength: number): Promise<boolean> {
    const [result] = await pool.execute(
      `UPDATE forge_phone_devices
          SET pin_hash = ?, pin_salt = ?, pin_length = ?, pin_fail_count = 0,
              pin_locked_until = NULL, pin_updated_at = CURRENT_TIMESTAMP
        WHERE device_id = ?`,
      [pinHash, pinSalt, pinLength, deviceId],
    );
    return (result as { affectedRows: number }).affectedRows > 0;
  }

  async clearFailures(deviceId: string): Promise<void> {
    await pool.execute(
      `UPDATE forge_phone_devices
          SET pin_fail_count = 0, pin_locked_until = NULL
        WHERE device_id = ?`,
      [deviceId],
    );
  }

  async recordFailure(deviceId: string, maxAttempts: number, lockSeconds: number): Promise<PhoneSecurityRecord | null> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute<SecurityRow[]>(
        `SELECT pin_hash, pin_salt, pin_length, pin_fail_count, pin_locked_until
           FROM forge_phone_devices
          WHERE device_id = ?
          LIMIT 1 FOR UPDATE`,
        [deviceId],
      );
      if (!rows[0]) {
        await connection.rollback();
        return null;
      }

      const nextCount = (Number(rows[0].pin_fail_count) || 0) + 1;
      const shouldLock = nextCount >= maxAttempts;
      await connection.execute(
        `UPDATE forge_phone_devices
            SET pin_fail_count = ?,
                pin_locked_until = CASE
                  WHEN ? THEN DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND)
                  ELSE pin_locked_until
                END
          WHERE device_id = ?`,
        [shouldLock ? 0 : nextCount, shouldLock, lockSeconds, deviceId],
      );
      await connection.commit();
      return this.get(deviceId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const SecurityRepo = new SecurityRepository();
