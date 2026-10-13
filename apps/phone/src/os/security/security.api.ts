import fetchNui from '@utils/fetchNui';
import { ServerPromiseResp } from '@typings/common';
import {
  ChangePinRequest,
  PhoneSecurityStatus,
  SecurityEvents,
  SetupPinRequest,
  VerifyPinRequest,
} from '@typings/security';

const browserFallback: ServerPromiseResp<PhoneSecurityStatus> = {
  status: 'ok',
  data: { configured: false, unlocked: false, attemptsRemaining: 5, lockedUntil: null, pinLength: null },
};

export const fetchSecurityStatus = () =>
  fetchNui<ServerPromiseResp<PhoneSecurityStatus>>(SecurityEvents.STATUS, undefined, browserFallback);

export const setupPhonePin = (pin: string) =>
  fetchNui<ServerPromiseResp<PhoneSecurityStatus>, SetupPinRequest>(
    SecurityEvents.SETUP_PIN,
    { pin },
    { ...browserFallback, data: { ...browserFallback.data!, configured: true, unlocked: true } },
  );

export const verifyPhonePin = (pin: string) =>
  fetchNui<ServerPromiseResp<PhoneSecurityStatus>, VerifyPinRequest>(
    SecurityEvents.VERIFY_PIN,
    { pin },
    { ...browserFallback, data: { ...browserFallback.data!, configured: true, unlocked: true } },
  );

export const changePhonePin = (currentPin: string, newPin: string) =>
  fetchNui<ServerPromiseResp<PhoneSecurityStatus>, ChangePinRequest>(
    SecurityEvents.CHANGE_PIN,
    { currentPin, newPin },
    { ...browserFallback, data: { ...browserFallback.data!, configured: true, unlocked: true } },
  );
