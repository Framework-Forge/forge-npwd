export const HOME_SLOTS_PER_PAGE = 20;
export const HOME_MAX_PAGES = 5;

export const SYSTEM_APP_IDS = ['DIALER', 'MESSAGES', 'CONTACTS', 'CAMERA', 'SETTINGS', 'FORGE_STORE'] as const;

export interface HomeWidgetPlacement {
  instanceId: string;
  widgetId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HomeLayout {
  pageCount: number;
  pages: Array<Array<string | null>>;
  widgets: HomeWidgetPlacement[];
  /** Undefined only on legacy profiles. They are migrated preserving every current app. */
  installedApps?: string[];
}

export enum HomeEvents {
  FETCH_LAYOUT = 'forge-npwd:home:fetch',
  SAVE_LAYOUT = 'forge-npwd:home:save',
}
