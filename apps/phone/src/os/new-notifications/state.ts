import {
  atom,
  atomFamily,
  selectorFamily,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import { ForgeNPWDNotification } from '@typings/notifications';

export const notifications = atomFamily<ForgeNPWDNotification, string>({
  key: 'forge-npwd:notifications',
  default: (id: string) => ({
    appId: '',
    key: id,
    id,
    content: '',
    secondaryTitle: '',
    path: '',
    onClick: null,
    keepOpen: false,
    duration: 0,
    isRead: false,
    isActive: false,
  }),
});

export const activeNotificationIds = atom<string[]>({
  key: 'forge-npwd:activeNotificationsIds',
  default: [],
});

export const allNotificationIds = atom<string[]>({
  key: 'forge-npwd:notificationsIds',
  default: [],
});

export const unreadNotificationIds = atom<string[]>({
  key: 'forge-npwd:unreadNotificationIds',
  default: [],
});

export const unreadNotifications = atom({
  key: 'forge-npwd:unreadNotifications',
  default: [],
});

export const barUncollapsed = atom<boolean>({
  key: 'forge-npwd:barUncollapsed',
  default: false,
});

export const notificationsForApp = selectorFamily<ForgeNPWDNotification[], string>({
  key: 'forge-npwd:notificationsForApp',
  get:
    (appId: string) =>
    ({ get }) => {
      const allNotisIds = get(allNotificationIds);

      return allNotisIds
        .map((id: string) => get(notifications(id)))
        .filter((n: ForgeNPWDNotification) => n.appId === appId);
    },
});

export const unreadNotificationsForApp = selectorFamily<ForgeNPWDNotification[], string>({
  key: 'forge-npwd:unreadNotificationsForApp',
  get:
    (appId: string) =>
    ({ get }) => {
      const allNotisIds = get(allNotificationIds);

      return allNotisIds
        .map((id: string) => get(notifications(id)))
        .filter((n: ForgeNPWDNotification) => !n.isRead && n.appId === appId);
    },
});

/* Returns all notification IDs for the specified app ID */
export const useNotificationsForApp = (appId: string) => useRecoilValue(notificationsForApp(appId));

/* Returns all unread notification IDs for the specified app ID */
export const useUnreadNotificationsForApp = (appId: string) =>
  useRecoilValue(unreadNotificationsForApp(appId));

export const useNavbarUncollapsed = () => useRecoilState(barUncollapsed);
export const useSetNavbarUncollapsed = () => useSetRecoilState(barUncollapsed);

export const useUnreadNotificationIds = () => useRecoilValue(unreadNotificationIds);
export const useUnreadNotifications = () => useRecoilValue(unreadNotifications);
