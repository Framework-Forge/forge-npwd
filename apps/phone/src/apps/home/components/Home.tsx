import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppWrapper } from '@ui/components';
import { AppIcon } from '@ui/components/AppIcon';
import { useApps } from '@os/apps/hooks/useApps';
import { useExternalApps } from '@common/hooks/useExternalApps';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HOME_MAX_PAGES, HOME_SLOTS_PER_PAGE, HomeLayout } from '@typings/home';
import {
  canPlaceWidget,
  findWidgetPlacement,
  homeCellKey,
  normalizeHomeLayout,
  occupiedWidgetCells,
  persistHomeLayout,
  useHomeLayout,
} from '../state/home.state';
import { useSnackbar } from '@os/snackbar/hooks/useSnackbar';
import { CORE_HOME_WIDGETS } from '../widgets/coreWidgets';
import { ResolvedHomeWidget, WidgetPicker } from './WidgetPicker';
import { IHomeWidgetSize } from '@os/apps/config/apps';

type LauncherApp = ReturnType<typeof useApps>['apps'][number];
type DragPoint = { x: number; y: number };
type DragSession = DragPoint & { kind: 'app' | 'widget'; id: string; pointerId: number; active: boolean };
type DropTarget = { pageIndex: number; slotIndex: number };
const sameLayout = (left: HomeLayout, right: HomeLayout) => JSON.stringify(left) === JSON.stringify(right);

class HomeWidgetBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error('Forge NPWD widget failed to render', error);
  }

  render() {
    if (this.state.failed) {
      return <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/70 px-3 text-center text-xs text-white/70">Widget indisponível</div>;
    }
    return this.props.children;
  }
}

export const HomeApp: React.FC = () => {
  const { apps } = useApps();
  const externalApps = useExternalApps() as LauncherApp[];
  const safeApps = Array.isArray(apps) ? apps : [];
  const safeExternalApps = Array.isArray(externalApps) ? externalApps : [];
  const allApps = useMemo(() => [...safeApps, ...safeExternalApps].filter((app) => app && !app.isDisabled), [safeApps, safeExternalApps]);
  const appById = useMemo(() => new Map(allApps.map((app) => [app.id, app])), [allApps]);
  const [layout, setLayout] = useHomeLayout();
  const installedAppIds = useMemo(() => new Set(layout.installedApps || []), [layout.installedApps]);
  const availableWidgets = useMemo<ResolvedHomeWidget[]>(() => [
    ...CORE_HOME_WIDGETS
      .filter((widget) => widget.id === 'forge_phone:clock' || installedAppIds.has(widget.id.split(':')[0]))
      .map((widget) => ({ ...widget, widgetId: widget.id })),
    ...safeExternalApps.filter((app) => installedAppIds.has(app.id)).flatMap((app) => (Array.isArray(app.homeWidgets) ? app.homeWidgets : [])
      .filter((widget) => widget && Array.isArray(widget.sizes) && typeof widget.Component === 'function')
      .map((widget) => ({
      ...widget,
      widgetId: `${app.id}:${widget.id}`,
      path: widget.path || app.path,
    }))),
  ], [safeExternalApps, installedAppIds]);
  const widgetById = useMemo(() => new Map(availableWidgets.map((widget) => [widget.widgetId, widget])), [availableWidgets]);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false);
  const [dragPoint, setDragPoint] = useState<DragPoint | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundHoldStart = useRef<DragPoint | null>(null);
  const backgroundHoldActivated = useRef(false);
  const dragSession = useRef<DragSession | null>(null);
  const suppressClick = useRef(false);
  const swipeStart = useRef<number | null>(null);
  const confirmedLayout = useRef(layout);
  const history = useHistory();
  const [t] = useTranslation();
  const { addAlert } = useSnackbar();

  useEffect(() => {
    const normalized = normalizeHomeLayout(layout, allApps.map((app) => app.id));
    if (!sameLayout(layout, normalized)) {
      setLayout(normalized);
      persistHomeLayout(normalized).then((response) => {
        if (response.status === 'ok' && response.data) confirmedLayout.current = response.data;
      });
    } else confirmedLayout.current = layout;
  }, [allApps, layout, setLayout]);

  useEffect(() => {
    if (page >= layout.pageCount) setPage(layout.pageCount - 1);
  }, [layout.pageCount, page]);

  const save = async (next: HomeLayout) => {
    const previous = confirmedLayout.current;
    setLayout(next);
    const response = await persistHomeLayout(next);
    if (response.status === 'ok' && response.data) {
      confirmedLayout.current = response.data;
      setLayout(response.data);
    } else {
      setLayout(previous);
      addAlert({ message: 'Não foi possível salvar a organização. Tente novamente.', type: 'error' });
    }
  };

  const moveApp = (appId: string, targetPage: number, targetSlot: number) => {
    const targetX = targetSlot % 4;
    const targetY = Math.floor(targetSlot / 4);
    if (occupiedWidgetCells(layout.widgets || []).has(homeCellKey(targetPage, targetX, targetY))) return;
    const pages = layout.pages.map((items) => [...items]);
    let sourcePage = -1;
    let sourceSlot = -1;
    pages.forEach((items, pageIndex) => {
      const index = items.indexOf(appId);
      if (index !== -1) [sourcePage, sourceSlot] = [pageIndex, index];
    });
    if (sourcePage === -1) return;
    const displaced = pages[targetPage][targetSlot] || null;
    pages[targetPage][targetSlot] = appId;
    pages[sourcePage][sourceSlot] = displaced;
    save({ ...layout, pages });
  };

  const addWidget = (widget: ResolvedHomeWidget, size: IHomeWidgetSize) => {
    const target = findWidgetPlacement(layout, size.width, size.height, page)
      || findWidgetPlacement(layout, size.width, size.height, page, true);
    if (!target) {
      addAlert({ message: 'Não há espaço livre para esse tamanho de widget.', type: 'error' });
      return;
    }
    const instanceId = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `widget-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const placement = { instanceId, widgetId: widget.widgetId, ...target, width: size.width, height: size.height };
    const widgets = [...(layout.widgets || []), placement];
    const pages = layout.pages.map((items) => Array.from({ length: HOME_SLOTS_PER_PAGE }, (_, index) => items[index] || null));
    const displaced: string[] = [];
    for (let y = target.y; y < target.y + size.height; y += 1) {
      for (let x = target.x; x < target.x + size.width; x += 1) {
        const slot = y * 4 + x;
        const appId = pages[target.page][slot];
        if (appId) displaced.push(appId);
        pages[target.page][slot] = null;
      }
    }

    let pageCount = layout.pageCount;
    const widgetCells = occupiedWidgetCells(widgets);
    for (const appId of displaced) {
      let inserted = false;
      while (!inserted) {
        for (let pageIndex = 0; pageIndex < pages.length && !inserted; pageIndex += 1) {
          for (let slot = 0; slot < HOME_SLOTS_PER_PAGE; slot += 1) {
            if (pages[pageIndex][slot]) continue;
            if (widgetCells.has(homeCellKey(pageIndex, slot % 4, Math.floor(slot / 4)))) continue;
            pages[pageIndex][slot] = appId;
            inserted = true;
            break;
          }
        }
        if (!inserted && pageCount < HOME_MAX_PAGES) {
          pages.push(Array.from({ length: HOME_SLOTS_PER_PAGE }, () => null));
          pageCount += 1;
        } else if (!inserted) {
          addAlert({ message: 'Não há espaço para reorganizar os aplicativos.', type: 'error' });
          return;
        }
      }
    }
    const next: HomeLayout = { pageCount, pages, widgets, installedApps: layout.installedApps };
    setWidgetPickerOpen(false);
    setPage(target.page);
    save(next);
  };

  const moveWidget = (instanceId: string, targetPage: number, targetSlot: number) => {
    const widget = (layout.widgets || []).find((entry) => entry.instanceId === instanceId);
    if (!widget) return;
    const x = targetSlot % 4;
    const y = Math.floor(targetSlot / 4);
    if (!canPlaceWidget(layout, targetPage, x, y, widget.width, widget.height, instanceId)) {
      addAlert({ message: 'Esse widget não cabe nessa posição.', type: 'error' });
      return;
    }
    save({
      ...layout,
      widgets: layout.widgets.map((entry) => entry.instanceId === instanceId
        ? { ...entry, page: targetPage, x, y }
        : entry),
    });
  };

  const removeWidget = (instanceId: string) => save({
    ...layout,
    widgets: (layout.widgets || []).filter((widget) => widget.instanceId !== instanceId),
  });

  const targetAtPoint = (x: number, y: number): DropTarget | null => {
    const grid = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-home-page-grid]');
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    const column = Math.max(0, Math.min(3, Math.floor(((x - rect.left) / rect.width) * 4)));
    const row = Math.max(0, Math.min(4, Math.floor(((y - rect.top) / rect.height) * 5)));
    const pageIndex = Number(grid.dataset.homePageGrid);
    const slotIndex = row * 4 + column;
    return Number.isInteger(pageIndex) && Number.isInteger(slotIndex)
      ? { pageIndex, slotIndex }
      : null;
  };

  const clearHoldTimer = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const clearBackgroundHold = () => {
    if (backgroundHoldTimer.current) clearTimeout(backgroundHoldTimer.current);
    backgroundHoldTimer.current = null;
    backgroundHoldStart.current = null;
  };

  const activateDrag = (session: DragSession) => {
    session.active = true;
    suppressClick.current = true;
    setEditing(true);
    if (session.kind === 'app') setDraggedId(session.id);
    else setDraggedWidgetId(session.id);
    setDragPoint({ x: session.x, y: session.y });
    setDropTarget(targetAtPoint(session.x, session.y));
  };

  const startHold = (kind: 'app' | 'widget', id: string, event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const session: DragSession = {
      kind,
      id,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      active: editing,
    };
    dragSession.current = session;
    if (editing) activateDrag(session);
    else holdTimer.current = setTimeout(() => activateDrag(session), 500);
  };

  const updateDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = dragSession.current;
    if (!session || session.pointerId !== event.pointerId) return;
    session.x = event.clientX;
    session.y = event.clientY;
    if (!session.active) return;
    event.preventDefault();
    setDragPoint({ x: session.x, y: session.y });

    const pageDot = document
      .elementFromPoint(session.x, session.y)
      ?.closest<HTMLElement>('[data-home-page-dot]');
    if (pageDot) {
      const nextPage = Number(pageDot.dataset.homePageDot);
      if (Number.isInteger(nextPage)) setPage(nextPage);
    }
    setDropTarget(targetAtPoint(session.x, session.y));
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    clearHoldTimer();
    const session = dragSession.current;
    dragSession.current = null;
    if (!session || session.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (session.active && !cancelled) {
      const target = targetAtPoint(event.clientX, event.clientY) || dropTarget;
      if (target) {
        if (session.kind === 'app') moveApp(session.id, target.pageIndex, target.slotIndex);
        else moveWidget(session.id, target.pageIndex, target.slotIndex);
      }
    }
    setDraggedId(null);
    setDraggedWidgetId(null);
    setDragPoint(null);
    setDropTarget(null);
  };

  return (
    <AppWrapper>
      <div
        className="relative h-full touch-none select-none overflow-hidden pb-12 pt-14"
        onPointerDown={(event) => {
          if (!(event.target as HTMLElement).closest('[data-home-app], [data-home-widget]')) {
            swipeStart.current = event.clientX;
            backgroundHoldActivated.current = false;
            backgroundHoldStart.current = { x: event.clientX, y: event.clientY };
            backgroundHoldTimer.current = setTimeout(() => {
              backgroundHoldActivated.current = true;
              swipeStart.current = null;
              setEditing(true);
            }, 500);
          }
        }}
        onPointerMove={(event) => {
          const start = backgroundHoldStart.current;
          if (start && (Math.abs(event.clientX - start.x) > 10 || Math.abs(event.clientY - start.y) > 10)) {
            clearBackgroundHold();
          }
        }}
        onPointerUp={(event) => {
          clearBackgroundHold();
          const start = swipeStart.current;
          swipeStart.current = null;
          if (editing || start === null) return;
          const delta = event.clientX - start;
          if (Math.abs(delta) >= 48) setPage((current) => delta < 0 ? Math.min(layout.pageCount - 1, current + 1) : Math.max(0, current - 1));
        }}
        onPointerCancel={clearBackgroundHold}
        onClick={(event) => {
          if (backgroundHoldActivated.current) {
            backgroundHoldActivated.current = false;
            return;
          }
          if (editing && event.currentTarget === event.target) setEditing(false);
        }}
      >
        <div className="flex h-full transition-transform duration-300 ease-out motion-reduce:duration-0" style={{ transform: `translateX(-${page * 100}%)` }}>
          {layout.pages.map((slots, pageIndex) => (
            <div
              key={pageIndex}
              data-home-page-grid={pageIndex}
              className="grid h-full min-w-full grid-cols-4 grid-rows-5 gap-y-1 px-2"
            >
              {Array.from({ length: HOME_SLOTS_PER_PAGE }, (_, slotIndex) => {
                const app = slots[slotIndex] ? appById.get(slots[slotIndex]) : null;
                return (
                  <div
                    key={slotIndex}
                    data-home-page={pageIndex}
                    data-home-slot={slotIndex}
                    className={`flex min-h-0 items-center justify-center rounded-2xl transition-colors ${editing && !app ? 'border border-dashed border-white/20 bg-black/5' : ''} ${dropTarget?.pageIndex === pageIndex && dropTarget?.slotIndex === slotIndex ? 'bg-white/20 ring-2 ring-white/70' : ''}`}
                    onClick={() => editing && !app && setEditing(false)}
                  >
                    {app && (
                      <div
                        data-home-app={app.id}
                        className={`flex w-full touch-none cursor-pointer flex-col items-center justify-center ${editing ? 'scale-95 animate-pulse' : ''} ${draggedId === app.id ? 'opacity-25' : ''}`}
                        onPointerDown={(event) => startHold('app', app.id, event)}
                        onPointerMove={updateDrag}
                        onPointerUp={(event) => finishDrag(event)}
                        onPointerCancel={(event) => finishDrag(event, true)}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (suppressClick.current) {
                            suppressClick.current = false;
                            return;
                          }
                          if (!editing) history.push(app.path);
                        }}
                        aria-label={String(t(app.nameLocale))}
                      >
                        <AppIcon {...(app as any)} />
                        <span className="mt-1 max-w-[78px] truncate text-center text-[11px] font-medium leading-tight text-white drop-shadow-md">{String(t(app.nameLocale))}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {(layout.widgets || []).filter((widget) => widget.page === pageIndex).map((placement) => {
                const widget = widgetById.get(placement.widgetId);
                if (!widget) return null;
                const WidgetComponent = widget.Component;
                return (
                  <div
                    key={placement.instanceId}
                    data-home-widget={placement.instanceId}
                    className={`relative z-10 m-1 touch-none overflow-visible transition-all ${editing ? 'scale-[0.98] animate-pulse ring-1 ring-white/40 rounded-2xl' : ''} ${draggedWidgetId === placement.instanceId ? 'opacity-25' : ''}`}
                    style={{
                      gridColumn: `${placement.x + 1} / span ${placement.width}`,
                      gridRow: `${placement.y + 1} / span ${placement.height}`,
                    }}
                    onPointerDown={(event) => startHold('widget', placement.instanceId, event)}
                    onPointerMove={updateDrag}
                    onPointerUp={(event) => finishDrag(event)}
                    onPointerCancel={(event) => finishDrag(event, true)}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (suppressClick.current) {
                        suppressClick.current = false;
                        return;
                      }
                      if (!editing && widget.path) history.push(widget.path);
                    }}
                    aria-label={widget.name}
                  >
                    <HomeWidgetBoundary key={placement.widgetId}>
                      <WidgetComponent width={placement.width} height={placement.height} />
                    </HomeWidgetBoundary>
                    {editing && (
                      <button
                        className="absolute -right-1 -top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow-lg"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeWidget(placement.instanceId);
                        }}
                        aria-label={`Remover ${widget.name}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {editing && (
          <>
            <button
              className="absolute right-3 top-16 z-30 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md"
              onClick={(event) => {
                event.stopPropagation();
                setEditing(false);
              }}
            >
              Concluir
            </button>
            <button
              className="absolute bottom-14 right-4 z-30 flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black shadow-xl"
              onClick={(event) => {
                event.stopPropagation();
                setWidgetPickerOpen(true);
              }}
            >
              <span className="text-xl leading-none">+</span> Widget
            </button>
          </>
        )}
        {layout.pageCount > 1 && (
          <div className="absolute bottom-7 left-0 right-0 flex justify-center gap-1.5">
            {layout.pages.map((_, index) => (
              <button
                key={index}
                data-home-page-dot={index}
                className="flex h-6 w-6 items-center justify-center"
                onClick={() => setPage(index)}
                aria-label={`Página ${index + 1}`}
              >
                <span className={`h-1.5 rounded-full transition-all ${index === page ? 'w-4 bg-white/90' : 'w-1.5 bg-white/40'}`} />
              </button>
            ))}
          </div>
        )}
        {draggedId && dragPoint && appById.get(draggedId) && (
          <div
            className="pointer-events-none fixed z-[9999] flex w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center scale-110 opacity-90 drop-shadow-2xl"
            style={{ left: dragPoint.x, top: dragPoint.y }}
          >
            <AppIcon {...(appById.get(draggedId) as any)} />
          </div>
        )}
        {draggedWidgetId && dragPoint && (
          <div
            className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/30 bg-black/75 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-md"
            style={{ left: dragPoint.x, top: dragPoint.y }}
          >
            Movendo widget
          </div>
        )}
        {widgetPickerOpen && (
          <WidgetPicker widgets={availableWidgets} onAdd={addWidget} onClose={() => setWidgetPickerOpen(false)} />
        )}
      </div>
    </AppWrapper>
  );
};
