import { config } from '@forge-npwd/config/server';
import { DbInterface } from '@forge-npwd/database';

export class _PlayerRepo {
  async fetchIdentifierFromPhoneNumber(phoneNumber: string): Promise<string | null> {
    const deviceQuery = `
      SELECT d.registered_owner_citizenid
        FROM forge_phone_lines l
        JOIN forge_phone_devices d ON d.profile_id = l.profile_id
       WHERE l.phone_number = ? AND l.status = 'active'
       ORDER BY (d.status = 'active') DESC, d.last_activated_at DESC
       LIMIT 1`;
    const deviceResult = await DbInterface._rawExec(deviceQuery, [phoneNumber]);
    const deviceRows = deviceResult?.[0] as { registered_owner_citizenid: string }[] | undefined;
    if (deviceRows?.[0]) return deviceRows[0].registered_owner_citizenid;

    const query = `SELECT ${config.database.identifierColumn} FROM ${config.database.playerTable} WHERE ${config.database.phoneNumberColumn} = ?`;
    const result = await DbInterface._rawExec(query, [phoneNumber]);
    const results = result?.[0] as any[] | undefined;
    // Get identifier from results
    return results?.[0]?.[config.database.identifierColumn] || null;
  }

  async fetchPhoneNumberFromIdentifier(identifier: string) {
    const deviceQuery = `
      SELECT l.phone_number
        FROM forge_phone_devices d
        JOIN forge_phone_lines l ON l.profile_id = d.profile_id
       WHERE d.registered_owner_citizenid = ?
         AND d.status = 'active'
         AND l.status = 'active'
       ORDER BY d.last_activated_at DESC, d.created_at DESC
       LIMIT 1`;
    const deviceResult = await DbInterface._rawExec(deviceQuery, [identifier]);
    const deviceRows = deviceResult?.[0] as { phone_number: string }[] | undefined;
    if (deviceRows?.[0]) return deviceRows[0].phone_number;

    const query = `SELECT ${config.database.phoneNumberColumn} FROM ${config.database.playerTable} WHERE ${config.database.identifierColumn} = ?`;

    const result = await DbInterface._rawExec(query, [identifier]);
    const results = result?.[0] as any[] | undefined;
    return results?.[0]?.[config.database.phoneNumberColumn] || null;
  }
}

export const PlayerRepo = new _PlayerRepo();
