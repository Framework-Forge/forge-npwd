import { SETTING_MENTIONS, SETTINGS_ALL_TWEETS } from './twitter';

export interface IconSetObject {
  custom: boolean;
  name: string;
}

export interface SettingOption<T = any> {
  label: string;
  value: T | string | number;
}

export enum KvpItems {
  ForgeNPWD_RINGTONE = 'forge-npwd-ringtone',
  ForgeNPWD_NOTIFICATION = 'forge-npwd-notification',
  ForgeNPWD_FRAME = 'forge-npwd-frame',
}

export type IPhoneLocalStorage = {
  [key: string]: IPhoneSettings;
};

export interface IPhoneSettings {
  language: SettingOption;
  iconSet: SettingOption<IconSetObject>;
  wallpaper: SettingOption;
  frame: SettingOption;
  theme: SettingOption;
  zoom: SettingOption;
  streamerMode: boolean;
  anonymousMode: boolean;
  ringtone: SettingOption;
  callVolume: number;
  notiSound: SettingOption;
  TWITTER_notiFilter: SettingOption<SETTING_MENTIONS | SETTINGS_ALL_TWEETS>;
  TWITTER_notiSound: SettingOption;
  TWITTER_notiSoundVol: number;
  TWITTER_notifyNewFeedTweet: boolean;
  MARKETPLACE_notifyNewListing: boolean;
}

export enum SettingEvents {
  NUI_SETTINGS_UPDATED = 'forge-npwd:nuiSettingsUpdated',
  PREVIEW_ALERT = 'forge-npwd:previewAlert',
  PREVIEW_RINGTONE = 'forge-npwd:previewRingtone',
}
