import { pool } from '@forge-npwd/database';
import { RowDataPacket } from 'mysql2';
import { HomeLayout } from '@typings/home';
import { normalizeSavedHome } from '../../../../compat/names';

interface ProfileSettingsRow extends RowDataPacket {
  settings: string | Record<string, unknown> | null;
}

const parseSettings = (value: ProfileSettingsRow['settings']): Record<string, unknown> => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export class HomeRepository {
  async fetch(profileId: string): Promise<HomeLayout | null> {
    const [rows] = await pool.execute<ProfileSettingsRow[]>(
      'SELECT settings FROM forge_phone_profiles WHERE profile_id = ? LIMIT 1',
      [profileId],
    );
    if (!rows[0]) return null;
    return normalizeSavedHome((parseSettings(rows[0].settings).home as HomeLayout) || null);
  }

  async save(profileId: string, home: HomeLayout): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute<ProfileSettingsRow[]>(
        'SELECT settings FROM forge_phone_profiles WHERE profile_id = ? LIMIT 1 FOR UPDATE',
        [profileId],
      );
      if (!rows[0]) {
        await connection.rollback();
        return false;
      }

      const settings = parseSettings(rows[0].settings);
      settings.home = home;
      await connection.execute(
        'UPDATE forge_phone_profiles SET settings = ? WHERE profile_id = ?',
        [JSON.stringify(settings), profileId],
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const HomeRepo = new HomeRepository();
