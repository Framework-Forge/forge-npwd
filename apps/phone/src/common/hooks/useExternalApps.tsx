import { IApp } from '@os/apps/config/apps';
import React, { useCallback, useEffect } from 'react';
import { Route } from 'react-router-dom';
import { createExternalAppProvider } from '@os/apps/utils/createExternalAppProvider';
import { useRecoilState, useRecoilValue } from 'recoil';
import { phoneState } from '@os/phone/hooks/state';

import {
  __federation_method_getRemote,
  __federation_method_setRemote,
  __federation_method_unwrapDefault,
  // @ts-ignore - This is virtual modules from the vite plugin. I guess they forgot to add defs.
} from '__federation__';
import { EnvMode } from '@utils/config';

const externalAppPromises = new Map<string, Promise<IApp | null>>();

const useExternalAppsAction = () => {
  const generateAppConfig = useCallback(async (appName: string): Promise<IApp> => {
    try {
      const IN_GAME = import.meta.env.PROD || import.meta.env.MODE === EnvMode.GAME;
      const url = IN_GAME
        ? `https://cfx-nui-${appName}/web/dist/remoteEntry.js`
        : 'http://localhost:4173/remoteEntry.js';
      const scope = appName;

      __federation_method_setRemote(scope, {
        url: () => Promise.resolve(url),
        format: 'esm',
        from: 'vite',
      });

      const mWrapper = await __federation_method_getRemote(scope, './config');
      const m = await __federation_method_unwrapDefault(mWrapper);

      const appConfig = m();
      const config = appConfig;
      config.Component = (props: object) => React.createElement(config.app, props);

      const Provider = createExternalAppProvider(config);

      config.Route = (props: any) => {
        return (
          <Route path={config.path}>
            <Provider>
              <config.Component {...props} />
            </Provider>
          </Route>
        );
      };

      config.icon = React.createElement(config.icon);
      config.NotificationIcon = config.notificationIcon;

      console.debug(`Successfully loaded external app "${appName}"`);
      return config;
    } catch (error: unknown) {
      console.error(
        `Failed to load external app "${appName}". Make sure it is started before Forge NPWD.`,
      );
      console.error(error);

      return null;
    }
  }, []);

  const getConfigs = useCallback(
    async (externalApps: string[], existingApps: IApp[]) => {
      const appAlreadyLoaded = (appName: string) => {
        return existingApps.find((app) => app.id === appName);
      };

      const configs = await Promise.all(
        externalApps.map(async (appName) => {
          const loaded = appAlreadyLoaded(appName);
          if (loaded) return loaded;

          let pending = externalAppPromises.get(appName);
          if (!pending) {
            pending = generateAppConfig(appName).catch((error) => {
              externalAppPromises.delete(appName);
              throw error;
            });
            externalAppPromises.set(appName, pending);
          }

          return pending;
        }),
      );

      return configs;
    },
    [generateAppConfig],
  );

  return {
    getConfigs,
  };
};

export const useExternalApps = () => {
  const [apps, setApps] = useRecoilState(phoneState.extApps);
  const { getConfigs } = useExternalAppsAction();
  const config = useRecoilValue(phoneState.resourceConfig);
  const configuredApps = Array.isArray(config?.apps)
    ? config.apps.filter((appName): appName is string => typeof appName === 'string' && appName.length > 0)
    : null;
  const configuredAppsKey = configuredApps ? JSON.stringify(configuredApps) : '';

  useEffect(() => {
    if (!configuredApps) return;
    let cancelled = false;

    getConfigs(configuredApps, []).then((configs) => {
      if (cancelled) return;
      const resolved = configs.filter((app): app is IApp => Boolean(app));
      setApps((current) => {
        const unchanged = current.length === resolved.length
          && current.every((app, index) => app === resolved[index]);
        return unchanged ? current : resolved;
      });
    }).catch((error) => {
      console.error('Failed to refresh external apps', error);
    });

    return () => {
      cancelled = true;
    };
  }, [configuredAppsKey, setApps, getConfigs]);

  return Array.isArray(apps) ? apps.filter((app): app is IApp => Boolean(app)) : [];
};
