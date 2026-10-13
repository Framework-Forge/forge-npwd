import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Delete, LockKeyhole, ShieldCheck } from 'lucide-react';
import { usePhoneVisibility } from '@os/phone/hooks/usePhoneVisibility';
import { useMyPhoneNumber } from '@os/simcard/hooks/useMyPhoneNumber';
import { PhoneSecurityStatus, PHONE_PIN_MAX_LENGTH, PHONE_PIN_MIN_LENGTH, SecurityEvents } from '@typings/security';
import { fetchSecurityStatus, setupPhonePin, verifyPhonePin } from './security.api';
import { useNuiEvent } from '@common/hooks/useNuiEvent';

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const PhoneSecurityGate: React.FC = () => {
  const { visibility } = usePhoneVisibility();
  const phoneNumber = useMyPhoneNumber();
  const [status, setStatus] = useState<PhoneSecurityStatus | null>(null);
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState(Date.now());

  const refreshStatus = useCallback(() => {
    if (!phoneNumber) return;
    setStatus(null);
    setPin('');
    setFirstPin(null);
    setMessage('');
    fetchSecurityStatus().then((response) => {
      if (response.status === 'ok' && response.data) setStatus(response.data);
      else setMessage('Não foi possível validar a segurança do aparelho.');
    });
  }, [phoneNumber]);

  useEffect(() => {
    if (visibility) refreshStatus();
  }, [refreshStatus, visibility]);

  useNuiEvent('SECURITY', SecurityEvents.REFRESH_UI, refreshStatus);

  useEffect(() => {
    const refresh = () => {
      fetchSecurityStatus().then((response) => {
        if (response.data) setStatus(response.data);
      });
    };
    window.addEventListener('forge-npwd-security-refresh', refresh);
    return () => window.removeEventListener('forge-npwd-security-refresh', refresh);
  }, []);

  useEffect(() => {
    if (!status?.lockedUntil) return undefined;
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status?.lockedUntil]);

  const lockedSeconds = useMemo(
    () => status?.lockedUntil ? Math.max(0, Math.ceil((status.lockedUntil - Date.now()) / 1000)) : 0,
    [status?.lockedUntil, clock],
  );

  if (status?.unlocked) return null;

  const append = (digit: string) => {
    if (loading || lockedSeconds > 0 || pin.length >= PHONE_PIN_MAX_LENGTH) return;
    setMessage('');
    const nextPin = `${pin}${digit}`;
    setPin(nextPin);
    if (status?.configured && status.pinLength && nextPin.length === status.pinLength) {
      void submit(nextPin);
    }
  };

  const submit = async (value = pin) => {
    if (value.length < PHONE_PIN_MIN_LENGTH || loading || !status) return;
    if (!status.configured && !firstPin) {
      setFirstPin(value);
      setPin('');
      setMessage('Digite novamente para confirmar.');
      return;
    }
    if (!status.configured && firstPin !== value) {
      setFirstPin(null);
      setPin('');
      setMessage('As senhas não coincidem. Comece novamente.');
      return;
    }

    setLoading(true);
    const response = status.configured ? await verifyPhonePin(value) : await setupPhonePin(value);
    setLoading(false);
    setPin('');
    if (response.data) setStatus(response.data);
    if (response.status !== 'ok') {
      setMessage(
        response.data?.lockedUntil
          ? 'Muitas tentativas. Aguarde para tentar novamente.'
          : `Senha incorreta. ${response.data?.attemptsRemaining ?? status.attemptsRemaining} tentativa(s) restante(s).`,
      );
    }
  };

  const title = !status
    ? 'Validando aparelho'
    : status.configured
      ? 'Aparelho bloqueado'
      : firstPin
        ? 'Confirme sua senha'
        : 'Crie uma senha';

  return (
    <div className="absolute inset-0 z-[10000] flex flex-col items-center bg-neutral-950/95 px-8 pb-8 pt-20 text-white backdrop-blur-xl">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
        {status?.configured ? <LockKeyhole size={30} /> : <ShieldCheck size={30} />}
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 min-h-[40px] text-center text-xs text-white/65">
        {!status
          ? message || 'Carregando as informações de segurança...'
          : lockedSeconds > 0
            ? `Tente novamente em ${Math.floor(lockedSeconds / 60)}:${String(lockedSeconds % 60).padStart(2, '0')}`
            : message || (status.configured ? 'Digite sua senha para acessar o Forge NPWD.' : 'Use de 4 a 6 números. Esta senha ficará protegida no servidor.')}
      </p>

      {status && (
        <>
          <div className="my-5 flex h-4 items-center justify-center gap-2">
            {Array.from({ length: pin.length }, (_, index) => (
              <span key={index} className="h-2.5 w-2.5 rounded-full bg-white" />
            ))}
          </div>
          <div className="grid w-full max-w-[250px] grid-cols-3 gap-3">
            {digits.map((digit) => (
              <button key={digit} type="button" onClick={() => append(digit)} className="h-14 rounded-full bg-white/10 text-xl font-medium transition-colors hover:bg-white/20 active:bg-white/30">
                {digit}
              </button>
            ))}
            <button type="button" onClick={() => setPin((current) => current.slice(0, -1))} className="flex h-14 items-center justify-center rounded-full bg-white/5 text-white/80">
              <Delete size={22} />
            </button>
            <button type="button" onClick={() => append('0')} className="h-14 rounded-full bg-white/10 text-xl font-medium transition-colors hover:bg-white/20 active:bg-white/30">
              0
            </button>
            {!status.configured || !status.pinLength ? (
              <button
                type="button"
                disabled={pin.length < PHONE_PIN_MIN_LENGTH || loading || lockedSeconds > 0}
                onClick={() => submit()}
                className="flex h-14 items-center justify-center rounded-full bg-white text-neutral-950 disabled:opacity-20"
                aria-label={firstPin ? 'Confirmar senha' : status.configured ? 'Desbloquear' : 'Continuar'}
              >
                <Check size={24} />
              </button>
            ) : <span />}
          </div>
          {loading && <span className="mt-4 text-xs text-white/60">Validando...</span>}
        </>
      )}
    </div>
  );
};
