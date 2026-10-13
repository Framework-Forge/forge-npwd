import {
  HOME_MAX_PAGES,
  HOME_SLOTS_PER_PAGE,
  HomeEvents,
  HomeLayout,
  HomeWidgetPlacement,
  SYSTEM_APP_IDS,
} from '@typings/home';
import { onNetPromise } from '../lib/PromiseNetEvents/onNetPromise';
import PlayerService from '../players/player.service';
import { mainLogger } from '../sv_logger';
import { HomeRepo } from './home.database';

const logger = mainLogger.child({ module: 'ForgePhoneHome' });
const emptyLayout = (): HomeLayout => ({ pageCount: 1, pages: [[]], widgets: [], installedApps: [...SYSTEM_APP_IDS] });

const sanitizeWidgets = (input: HomeLayout, pageCount: number): HomeWidgetPlacement[] => {
  if (input.widgets === undefined) return [];
  if (!Array.isArray(input.widgets) || input.widgets.length > 20) throw new Error('INVALID_WIDGETS');

  const instances = new Set<string>();
  const occupied = new Set<string>();
  return input.widgets.map((widget) => {
    const values = [widget?.page, widget?.x, widget?.y, widget?.width, widget?.height];
    if (
      !widget ||
      typeof widget.instanceId !== 'string' ||
      widget.instanceId.length < 1 ||
      widget.instanceId.length > 64 ||
      instances.has(widget.instanceId) ||
      typeof widget.widgetId !== 'string' ||
      widget.widgetId.length < 1 ||
      widget.widgetId.length > 96 ||
      values.some((value) => !Number.isInteger(value)) ||
      widget.page < 0 ||
      widget.page >= pageCount ||
      widget.x < 0 ||
      widget.y < 0 ||
      widget.width < 1 ||
      widget.height < 1 ||
      widget.x + widget.width > 4 ||
      widget.y + widget.height > 5
    ) {
      throw new Error('INVALID_WIDGET');
    }

    instances.add(widget.instanceId);
    for (let y = widget.y; y < widget.y + widget.height; y += 1) {
      for (let x = widget.x; x < widget.x + widget.width; x += 1) {
        const cell = `${widget.page}:${x}:${y}`;
        if (occupied.has(cell)) throw new Error('OVERLAPPING_WIDGETS');
        occupied.add(cell);
      }
    }
    return {
      instanceId: widget.instanceId,
      widgetId: widget.widgetId,
      page: widget.page,
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
    };
  });
};

const sanitizeLayout = (input: HomeLayout): HomeLayout | null => {
  const pageCount = Number(input?.pageCount);
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > HOME_MAX_PAGES) return null;
  if (!Array.isArray(input.pages) || input.pages.length !== pageCount) return null;

  const seen = new Set<string>();
  let installedApps: string[] | undefined;
  if (input.installedApps !== undefined) {
    if (!Array.isArray(input.installedApps) || input.installedApps.length > 64) return null;
    const installed = new Set<string>();
    for (const appId of input.installedApps) {
      if (typeof appId !== 'string' || appId.length < 1 || appId.length > 64) return null;
      installed.add(appId);
    }
    SYSTEM_APP_IDS.forEach((appId) => installed.add(appId));
    installedApps = [...installed];
  }
  const widgets = sanitizeWidgets(input, pageCount);
  const widgetCells = new Set<string>();
  widgets.forEach((widget) => {
    for (let y = widget.y; y < widget.y + widget.height; y += 1) {
      for (let x = widget.x; x < widget.x + widget.width; x += 1) {
        widgetCells.add(`${widget.page}:${x}:${y}`);
      }
    }
  });
  const pages = input.pages.map((page, pageIndex) => {
    if (!Array.isArray(page) || page.length > HOME_SLOTS_PER_PAGE) throw new Error('INVALID_PAGE');
    return Array.from({ length: HOME_SLOTS_PER_PAGE }, (_, index) => {
      const value = page[index];
      if (value === null || value === undefined || value === '') return null;
      const x = index % 4;
      const y = Math.floor(index / 4);
      if (widgetCells.has(`${pageIndex}:${x}:${y}`)) throw new Error('WIDGET_APP_OVERLAP');
      if (typeof value !== 'string' || value.length > 64 || seen.has(value)) {
        throw new Error('INVALID_APP');
      }
      if (installedApps && !installedApps.includes(value)) throw new Error('APP_NOT_INSTALLED');
      seen.add(value);
      return value;
    });
  });

  return { pageCount, pages, widgets, installedApps };
};

onNetPromise<void, HomeLayout>(HomeEvents.FETCH_LAYOUT, async (req, resp) => {
  try {
    const profileId = PlayerService.getPlayer(req.source)?.getActiveProfileId();
    if (!profileId) return resp({ status: 'error', errorMsg: 'NO_ACTIVE_DEVICE' });
    resp({ status: 'ok', data: (await HomeRepo.fetch(profileId)) || emptyLayout() });
  } catch (error) {
    logger.error(`Failed to fetch home layout for ${req.source}: ${error.message}`);
    resp({ status: 'error', errorMsg: 'HOME_LOAD_FAILED' });
  }
});

onNetPromise<HomeLayout, HomeLayout>(HomeEvents.SAVE_LAYOUT, async (req, resp) => {
  try {
    const profileId = PlayerService.getPlayer(req.source)?.getActiveProfileId();
    if (!profileId) return resp({ status: 'error', errorMsg: 'NO_ACTIVE_DEVICE' });
    const layout = sanitizeLayout(req.data);
    if (!layout) return resp({ status: 'error', errorMsg: 'INVALID_HOME_LAYOUT' });
    if (!(await HomeRepo.save(profileId, layout))) {
      return resp({ status: 'error', errorMsg: 'PROFILE_NOT_FOUND' });
    }
    resp({ status: 'ok', data: layout });
  } catch (error) {
    logger.error(`Failed to save home layout for ${req.source}: ${error.message}`);
    resp({ status: 'error', errorMsg: 'HOME_SAVE_FAILED' });
  }
});
