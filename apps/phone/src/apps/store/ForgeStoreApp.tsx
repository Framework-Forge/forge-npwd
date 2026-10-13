import React, { useMemo, useState } from 'react';
import { AppWrapper } from '@ui/components';
import { useApps } from '@os/apps/hooks/useApps';
import { useExternalApps } from '@common/hooks/useExternalApps';
import { SYSTEM_APP_IDS } from '@typings/home';
import { persistHomeLayout, setHomeAppInstalled, useHomeLayout } from '@apps/home/state/home.state';
import { useSnackbar } from '@os/snackbar/hooks/useSnackbar';
import { useTranslation } from 'react-i18next';

type StoreApp = ReturnType<typeof useApps>['apps'][number];
const SYSTEM_APPS = new Set<string>(SYSTEM_APP_IDS);

export const ForgeStoreApp: React.FC = () => {
  const { apps } = useApps();
  const externalApps = useExternalApps() as StoreApp[];
  const [layout, setLayout] = useHomeLayout();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [busyAction, setBusyAction] = useState<'install' | 'remove' | null>(null);
  const { addAlert } = useSnackbar();
  const [t] = useTranslation();
  const allApps = useMemo(() => [...apps, ...externalApps].filter((app) => app && !app.isDisabled), [apps, externalApps]);
  const installed = useMemo(() => new Set<string>(layout.installedApps || [...SYSTEM_APP_IDS]), [layout.installedApps]);
  const externalIds = useMemo(() => new Set(externalApps.map((app) => app.id)), [externalApps]);
  const catalog = useMemo(() => allApps
    .filter((app) => !SYSTEM_APPS.has(app.id))
    .filter((app) => {
      const label = String(t(app.nameLocale));
      return !query || `${label} ${app.id}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'));
    })
    .sort((left, right) => String(t(left.nameLocale)).localeCompare(String(t(right.nameLocale)), 'pt-BR')),
  [allApps, query, t]);

  const toggle = async (appId: string, shouldInstall: boolean) => {
    if (busy) return;
    setBusy(appId);
    setBusyAction(shouldInstall ? 'install' : 'remove');
    setProgress(8);
    const progressTimer = window.setInterval(() => {
      setProgress((current) => current >= 88 ? current : Math.min(88, current + Math.max(2, Math.ceil((88 - current) * 0.18))));
    }, 120);
    const previous = layout;
    const next = setHomeAppInstalled(layout, appId, shouldInstall, allApps.map((app) => app.id));
    setLayout(next);
    try {
      const [response] = await Promise.all([
        persistHomeLayout(next),
        new Promise((resolve) => window.setTimeout(resolve, 650)),
      ]);
      if (response.status !== 'ok' || !response.data) throw new Error('STORE_SAVE_FAILED');
      setLayout(response.data);
      setProgress(100);
      await new Promise((resolve) => window.setTimeout(resolve, 220));
      addAlert({ message: shouldInstall ? 'Aplicativo instalado.' : 'Aplicativo desinstalado.', type: 'success' });
    } catch {
      setLayout(previous);
      addAlert({ message: 'Não foi possível alterar o aplicativo.', type: 'error' });
    } finally {
      window.clearInterval(progressTimer);
      setBusy(null);
      setBusyAction(null);
      setProgress(0);
    }
  };

  return (
    <AppWrapper>
      <div className="flex h-full flex-col overflow-hidden bg-neutral-950 px-4 pb-4 pt-14 text-white">
        <div className="shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-2xl shadow-lg">F</div>
            <div>
              <h1 className="text-xl font-bold">Forge Store</h1>
              <p className="text-xs text-white/50">Aplicativos deste aparelho</p>
            </div>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar aplicativos"
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-orange-400/70"
          />
          <div className="mt-3 flex gap-2 text-[10px] font-semibold text-white/55">
            <span className="rounded-full bg-white/10 px-3 py-1.5">{catalog.length} disponíveis</span>
            <span className="rounded-full bg-orange-500/20 px-3 py-1.5 text-orange-300">{catalog.filter((app) => installed.has(app.id)).length} instalados</span>
          </div>
        </div>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto pb-8">
          {catalog.map((app) => {
            const isInstalled = installed.has(app.id);
            return (
              <div key={app.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl shadow-md" style={{ backgroundColor: app.backgroundColor, color: app.color }}>
                  {app.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{String(t(app.nameLocale))}</div>
                  <div className="mt-1 text-[10px] text-white/45">{externalIds.has(app.id) ? 'Aplicativo Forge' : 'Aplicativo do sistema'}</div>
                  {busy === app.id && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-[width] duration-150 ${busyAction === 'remove' ? 'bg-red-400' : 'bg-orange-400'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  disabled={busy !== null}
                  onClick={() => void toggle(app.id, !isInstalled)}
                  className={`min-w-[78px] rounded-full px-3 py-2 text-xs font-bold transition ${isInstalled ? 'bg-white/10 text-white/70' : 'bg-orange-500 text-white'} disabled:opacity-40`}
                >
                  {busy === app.id
                    ? `${busyAction === 'remove' ? 'Removendo' : 'Instalando'} ${progress}%`
                    : isInstalled ? 'Remover' : 'Instalar'}
                </button>
              </div>
            );
          })}
          {!catalog.length && <div className="py-16 text-center text-sm text-white/45">Nenhum aplicativo encontrado.</div>}
        </div>
      </div>
    </AppWrapper>
  );
};
