import {
  ChangePinRequest,
  SecurityEvents,
  SetupPinRequest,
  VerifyPinRequest,
  PhoneSecurityStatus,
} from '@typings/security';
import { onNetPromise } from '../lib/PromiseNetEvents/onNetPromise';
import { PhoneSecurityService } from './security.service';
import { getSource } from '../utils/miscUtils';

const respondWithError = (
  error: unknown,
  resp: (data: { status: 'error'; errorMsg: string; data?: PhoneSecurityStatus }) => void,
) => {
  const typed = error as { message?: string; status?: PhoneSecurityStatus };
  resp({ status: 'error', errorMsg: typed.message || 'SECURITY_ERROR', data: typed.status });
};

onNetPromise<void, PhoneSecurityStatus>(SecurityEvents.STATUS, async (req, resp) => {
  const status = await PhoneSecurityService.status(req.source);
  if (!status) return resp({ status: 'error', errorMsg: 'NO_ACTIVE_DEVICE' });
  resp({ status: 'ok', data: status });
});

onNetPromise<SetupPinRequest, PhoneSecurityStatus>(SecurityEvents.SETUP_PIN, async (req, resp) => {
  try {
    const status = await PhoneSecurityService.setup(req.source, req.data?.pin);
    if (!status) return resp({ status: 'error', errorMsg: 'NO_ACTIVE_DEVICE' });
    resp({ status: 'ok', data: status });
  } catch (error) {
    respondWithError(error, resp);
  }
});

onNetPromise<VerifyPinRequest, PhoneSecurityStatus>(SecurityEvents.VERIFY_PIN, async (req, resp) => {
  try {
    const status = await PhoneSecurityService.verify(req.source, req.data?.pin);
    if (!status) return resp({ status: 'error', errorMsg: 'NO_ACTIVE_DEVICE' });
    if (!status.unlocked) return resp({ status: 'error', errorMsg: 'DEVICE_LOCKED', data: status });
    resp({ status: 'ok', data: status });
  } catch (error) {
    respondWithError(error, resp);
  }
});

onNetPromise<ChangePinRequest, PhoneSecurityStatus>(SecurityEvents.CHANGE_PIN, async (req, resp) => {
  try {
    const status = await PhoneSecurityService.change(
      req.source,
      req.data?.currentPin,
      req.data?.newPin,
    );
    if (!status) return resp({ status: 'error', errorMsg: 'NO_ACTIVE_DEVICE' });
    resp({ status: 'ok', data: status });
  } catch (error) {
    respondWithError(error, resp);
  }
});

onNet(SecurityEvents.LOCK_SESSION, () => {
  PhoneSecurityService.lockSource(getSource());
});

on('playerDropped', () => {
  PhoneSecurityService.lockSource(getSource());
});
