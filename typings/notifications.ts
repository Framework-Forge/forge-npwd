export enum NotificationEvents {
  CREATE_NOTIFICATION = 'forge-npwd:createNotification',
  REMOVE_NOTIFICATOIN = 'forge-npwd:removeNotification',
  CREATE_SYSTEM_NOTIFICATION = 'forge-npwd:createSystemNotification',
  REMOVE_SYSTEM_NOTIFICATION = 'forge-npwd:removeSystemNotification',
}

export type ForgeNPWDNotification = {
  appId: string;
  secondaryTitle?: string;
  content: HTMLElement | string;
  path?: string;
  onClick?: () => void;
  isRead: boolean;
  isActive: boolean;
  keepOpen: boolean;
  duration: number;
  id: string;
};

export type UnreadNotificationBarProps = {
  id: string;
  appId: string;
};

export type CreateNotificationDTO = {
  appId: string;
  content: string;
  secondaryTitle: string;
  duration: number;
  keepOpen: boolean;
  path: string;
  notisId: string;
  onClick: () => void | null;
};

export type SystemNotificationDTO = {
  uniqId: string;
  content: string;
  secondaryTitle: string;
  keepOpen: boolean;
  duration: number;
  onConfirm?: () => void;
  onCancel?: () => void;
  controls?: boolean;
};
