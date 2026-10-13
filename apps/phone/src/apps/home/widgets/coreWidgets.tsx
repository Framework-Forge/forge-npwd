import React, { useCallback, useEffect, useState } from 'react';
import { IHomeWidgetConfig, IHomeWidgetRenderProps } from '@os/apps/config/apps';

const ClockWidget: React.FC<IHomeWidgetRenderProps> = ({ width, height }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const compact = height === 1;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/55 px-2 text-white shadow-xl backdrop-blur-md">
      <span className={`${width >= 4 ? 'text-4xl' : 'text-2xl'} font-light tabular-nums leading-none`}>
        {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </span>
      {!compact && (
        <span className="mt-1 text-[11px] font-medium capitalize text-white/75">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </span>
      )}
    </div>
  );
};

interface MailItem {
  mailid: number;
  sender: string;
  subject: string;
  message: string;
  read: number;
  date: string | number;
}

const MailWidget: React.FC<IHomeWidgetRenderProps> = ({ width, height }) => {
  const [mails, setMails] = useState<MailItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('https://forge-npwd-mail/forge-npwd:mail:getMail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: '{}',
      });
      const result = await response.json();
      if (result?.status === 'ok' && Array.isArray(result.data)) setMails(result.data);
    } catch {
      // O recurso pode estar reiniciando; a próxima atualização tenta novamente.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    const onMessage = (event: MessageEvent) => {
      if (event.data?.method === 'newMail' || event.data?.action === 'newMail') void refresh();
    };
    window.addEventListener('message', onMessage);
    return () => { window.clearInterval(timer); window.removeEventListener('message', onMessage); };
  }, [refresh]);

  const unread = mails.filter((mail) => Number(mail.read) !== 1);
  const compact = width === 2 && height === 1;
  const formatTime = (value: string | number) => {
    const parsed = new Date(typeof value === 'number' && value < 100000000000 ? value * 1000 : value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'hidden', borderRadius: 16, padding: compact ? '9px 11px' : '10px 14px', color: '#fff', background: 'linear-gradient(145deg,#3f3f46,#18181b)', border: '1px solid rgba(255,255,255,.16)', boxShadow: '0 10px 24px rgba(0,0,0,.28)', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em' }}>MAIL</span><span style={{ display: 'grid', minWidth: 20, height: 20, placeItems: 'center', borderRadius: 10, padding: '0 5px', background: unread.length ? '#ef4444' : 'rgba(255,255,255,.12)', fontSize: 10, fontWeight: 800 }}>{unread.length}</span></div>
      {compact ? <><div style={{ marginTop: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 750 }}>{unread[0]?.sender || mails[0]?.sender || (loaded ? 'Nenhum e-mail' : 'Atualizando…')}</div><div style={{ marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 9, opacity: .65 }}>{unread[0]?.subject || mails[0]?.subject || 'Caixa de entrada em dia'}</div></> : <div style={{ marginTop: 7, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,.1)' }}>
        {(unread.length ? unread : mails).slice(0, 3).map((mail) => <div key={mail.mailid} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 6 }}><div style={{ minWidth: 0 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10, fontWeight: Number(mail.read) !== 1 ? 800 : 600 }}>{mail.sender}</div><div style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 9, opacity: .62 }}>{mail.subject}</div></div><span style={{ fontSize: 8, opacity: .5 }}>{formatTime(mail.date)}</span></div>)}
        {!mails.length && <div style={{ marginTop: 18, textAlign: 'center', fontSize: 10, opacity: .55 }}>{loaded ? 'Nenhum e-mail recebido.' : 'Atualizando caixa de entrada…'}</div>}
      </div>}
    </div>
  );
};

export const CORE_HOME_WIDGETS: IHomeWidgetConfig[] = [
  {
    id: 'forge_phone:clock',
    name: 'Relógio digital',
    description: 'Hora e data atualizadas automaticamente.',
    sizes: [
      { width: 2, height: 1, label: 'Compacto 2×1' },
      { width: 4, height: 1, label: 'Largo 4×1' },
      { width: 4, height: 2, label: 'Grande 4×2' },
    ],
    Component: ClockWidget,
  },
  {
    id: 'forge-npwd-mail:inbox',
    name: 'Caixa de entrada',
    description: 'E-mails recentes e mensagens não lidas.',
    sizes: [
      { width: 2, height: 1, label: 'Compacto 2×1' },
      { width: 4, height: 2, label: 'Caixa de entrada 4×2' },
    ],
    Component: MailWidget,
    path: '/forge-npwd-mail',
  },
];
