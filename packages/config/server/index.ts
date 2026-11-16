import { ResourceConfig } from '@typings/config';
import defaultConfig from '../../../config.default.json';
import { deepMergeObjects } from '@shared/deepMergeObjects';

export const getConfig = (): ResourceConfig => {
  const resourceName = GetCurrentResourceName();
  const config: ResourceConfig = JSON.parse(LoadResourceFile(resourceName, 'config.json'));

  return deepMergeObjects({}, defaultConfig, config);
};


export const config = (() => {
  const config = getConfig();

  let database: Record<string, string> | string = GetConvar('forge-npwd:database', '');
  if (database !== '') {
    database = JSON.parse(database) as Record<string, string>;
    Object.entries(config.database).forEach(([key, value]) => {
      const record = database as Record<string, string>;
      const configDb = config.database as unknown as Record<string, string>;

      if (record[key] && typeof value === typeof record[key]) {
        configDb[key] = record[key];
      }
    });
  }

  // PR Bridge owns the character lifecycle; do not also load license sessions.
  config.general.useResourceIntegration = true;

  return config;
})();
