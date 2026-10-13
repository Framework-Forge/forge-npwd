import { atomFamily, selectorFamily, useRecoilState } from 'recoil';
import {
  HOME_MAX_PAGES,
  HOME_SLOTS_PER_PAGE,
  HomeEvents,
  HomeLayout,
  HomeWidgetPlacement,
  SYSTEM_APP_IDS,
} from '@typings/home';
import { ServerPromiseResp } from '@typings/common';
import fetchNui from '@utils/fetchNui';
import { useMyPhoneNumber } from '@os/simcard/hooks/useMyPhoneNumber';

export const HOME_COLUMNS = 4;
export const HOME_ROWS = 5;

export const defaultHomeLayout = (): HomeLayout => ({
  pageCount: 1,
  pages: [[]],
  widgets: [],
  installedApps: [...SYSTEM_APP_IDS],
});

export const homeCellKey = (page: number, x: number, y: number) => `${page}:${x}:${y}`;

const validWidget = (widget: HomeWidgetPlacement, pageCount: number) =>
  widget &&
  typeof widget.instanceId === 'string' &&
  typeof widget.widgetId === 'string' &&
  [widget.page, widget.x, widget.y, widget.width, widget.height].every(Number.isInteger) &&
  widget.page >= 0 &&
  widget.page < pageCount &&
  widget.x >= 0 &&
  widget.y >= 0 &&
  widget.width >= 1 &&
  widget.height >= 1 &&
  widget.x + widget.width <= HOME_COLUMNS &&
  widget.y + widget.height <= HOME_ROWS;

const normalizeWidgets = (input: HomeLayout, pageCount: number): HomeWidgetPlacement[] => {
  const instances = new Set<string>();
  const occupied = new Set<string>();
  const widgets: HomeWidgetPlacement[] = [];
  for (const candidate of Array.isArray(input?.widgets) ? input.widgets : []) {
    if (!validWidget(candidate, pageCount) || instances.has(candidate.instanceId)) continue;
    const cells: string[] = [];
    for (let y = candidate.y; y < candidate.y + candidate.height; y += 1) {
      for (let x = candidate.x; x < candidate.x + candidate.width; x += 1) {
        cells.push(homeCellKey(candidate.page, x, y));
      }
    }
    if (cells.some((cell) => occupied.has(cell))) continue;
    instances.add(candidate.instanceId);
    cells.forEach((cell) => occupied.add(cell));
    widgets.push({ ...candidate });
  }
  return widgets;
};

export const occupiedWidgetCells = (widgets: HomeWidgetPlacement[], ignoreInstanceId?: string) => {
  const cells = new Set<string>();
  widgets.forEach((widget) => {
    if (widget.instanceId === ignoreInstanceId) return;
    for (let y = widget.y; y < widget.y + widget.height; y += 1) {
      for (let x = widget.x; x < widget.x + widget.width; x += 1) {
        cells.add(homeCellKey(widget.page, x, y));
      }
    }
  });
  return cells;
};

export const canPlaceWidget = (
  layout: HomeLayout,
  page: number,
  x: number,
  y: number,
  width: number,
  height: number,
  ignoreInstanceId?: string,
  allowAppCells = false,
) => {
  if (page < 0 || page >= layout.pageCount || x < 0 || y < 0 || x + width > HOME_COLUMNS || y + height > HOME_ROWS) return false;
  const widgetCells = occupiedWidgetCells(layout.widgets || [], ignoreInstanceId);
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      if (widgetCells.has(homeCellKey(page, column, row))) return false;
      if (!allowAppCells && layout.pages[page]?.[row * HOME_COLUMNS + column]) return false;
    }
  }
  return true;
};

export const findWidgetPlacement = (
  layout: HomeLayout,
  width: number,
  height: number,
  preferredPage = 0,
  allowAppCells = false,
) => {
  const pageOrder = Array.from({ length: layout.pageCount }, (_, offset) => (preferredPage + offset) % layout.pageCount);
  for (const page of pageOrder) {
    for (let y = 0; y <= HOME_ROWS - height; y += 1) {
      for (let x = 0; x <= HOME_COLUMNS - width; x += 1) {
        if (canPlaceWidget(layout, page, x, y, width, height, undefined, allowAppCells)) return { page, x, y };
      }
    }
  }
  return null;
};

export const normalizeHomeLayout = (input: HomeLayout, appIds: string[]): HomeLayout => {
  const pageCount = Math.max(1, Math.min(HOME_MAX_PAGES, Number(input?.pageCount) || 1));
  const normalizedWidgets = normalizeWidgets(input, pageCount);
  const legacyPageApps = (input?.pages || []).flat().filter((appId): appId is string => typeof appId === 'string');
  const legacyWidgetApps = normalizedWidgets
    .map((widget) => widget.widgetId.split(':')[0])
    .filter((appId) => appId && appId !== 'forge_phone');
  const legacyHasApps = legacyPageApps.length > 0 || legacyWidgetApps.length > 0;
  const requestedApps = input?.installedApps === undefined
    ? (legacyHasApps ? [...appIds, ...legacyPageApps, ...legacyWidgetApps] : [...SYSTEM_APP_IDS])
    : input.installedApps;
  // Keep IDs whose external bundle has not loaded yet. Removing them here would
  // uninstall apps during the first render of the phone.
  const installedApps = [...new Set([...SYSTEM_APP_IDS, ...requestedApps])];
  const validApps = new Set(installedApps);
  const widgets = normalizedWidgets.filter((widget) => {
    const ownerId = widget.widgetId.split(':')[0];
    return ownerId === 'forge_phone' || validApps.has(ownerId);
  });
  const widgetCells = occupiedWidgetCells(widgets);
  const seen = new Set<string>();
  const pages = Array.from({ length: pageCount }, (_, pageIndex) =>
    Array.from({ length: HOME_SLOTS_PER_PAGE }, (_, slotIndex) => {
      if (widgetCells.has(homeCellKey(pageIndex, slotIndex % HOME_COLUMNS, Math.floor(slotIndex / HOME_COLUMNS)))) return null;
      const value = input?.pages?.[pageIndex]?.[slotIndex];
      if (typeof value !== 'string' || !validApps.has(value) || seen.has(value)) return null;
      seen.add(value);
      return value;
    }),
  );

  for (const appId of installedApps) {
    if (seen.has(appId)) continue;
    let inserted = false;
    for (let pageIndex = 0; pageIndex < pages.length && !inserted; pageIndex += 1) {
      for (let slot = 0; slot < HOME_SLOTS_PER_PAGE; slot += 1) {
        if (pages[pageIndex][slot] !== null) continue;
        if (widgetCells.has(homeCellKey(pageIndex, slot % HOME_COLUMNS, Math.floor(slot / HOME_COLUMNS)))) continue;
        pages[pageIndex][slot] = appId;
        inserted = true;
        break;
      }
    }
    if (!inserted && pages.length < HOME_MAX_PAGES) {
      const page = Array.from({ length: HOME_SLOTS_PER_PAGE }, () => null as string | null);
      page[0] = appId;
      pages.push(page);
    }
  }

  return { pageCount: pages.length, pages, widgets, installedApps };
};

export const setHomeAppInstalled = (
  layout: HomeLayout,
  appId: string,
  installed: boolean,
  availableAppIds: string[],
): HomeLayout => {
  const current = new Set(layout.installedApps || []);
  if (installed) current.add(appId);
  else current.delete(appId);
  SYSTEM_APP_IDS.forEach((systemId) => current.add(systemId));

  const pages = layout.pages.map((page) => page.map((value) => value === appId && !installed ? null : value));
  const widgets = installed
    ? (layout.widgets || [])
    : (layout.widgets || []).filter((widget) => !widget.widgetId.startsWith(`${appId}:`));

  return normalizeHomeLayout({ ...layout, pages, widgets, installedApps: [...current] }, availableAppIds);
};

export const resizeHomeLayout = (layout: HomeLayout, pageCount: number): HomeLayout => {
  const count = Math.max(1, Math.min(HOME_MAX_PAGES, pageCount));
  const widgets = (layout.widgets || []).filter((widget) => widget.page < count);
  const widgetCells = occupiedWidgetCells(widgets);
  const apps = layout.pages.flat().filter((value): value is string => typeof value === 'string');
  const pages = Array.from({ length: count }, () =>
    Array.from({ length: HOME_SLOTS_PER_PAGE }, () => null as string | null),
  );
  let appIndex = 0;
  for (let page = 0; page < count && appIndex < apps.length; page += 1) {
    for (let slot = 0; slot < HOME_SLOTS_PER_PAGE && appIndex < apps.length; slot += 1) {
      if (widgetCells.has(homeCellKey(page, slot % HOME_COLUMNS, Math.floor(slot / HOME_COLUMNS)))) continue;
      pages[page][slot] = apps[appIndex];
      appIndex += 1;
    }
  }
  return { pageCount: count, pages, widgets, installedApps: layout.installedApps };
};

const homeLayoutState = atomFamily<HomeLayout, string>({
  key: 'forgePhoneHomeLayout',
  default: selectorFamily<HomeLayout, string>({
    key: 'forgePhoneHomeLayoutDefault',
    get: () => async () => {
      try {
        const response = await fetchNui<ServerPromiseResp<HomeLayout>>(
          HomeEvents.FETCH_LAYOUT,
          undefined,
          { status: 'ok', data: defaultHomeLayout() },
        );
        return response.status === 'ok' && response.data ? response.data : defaultHomeLayout();
      } catch {
        return defaultHomeLayout();
      }
    },
  }),
});

export const useHomeLayout = () => {
  const phoneNumber = useMyPhoneNumber();
  return useRecoilState(homeLayoutState(phoneNumber || '__no_active_device__'));
};

export const persistHomeLayout = (layout: HomeLayout) =>
  fetchNui<ServerPromiseResp<HomeLayout>, HomeLayout>(HomeEvents.SAVE_LAYOUT, layout, {
    status: 'ok',
    data: layout,
  });
