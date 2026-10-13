import { mainLogger } from '../sv_logger';
import { PhoneRecoveryService } from './recovery.service';

const logger = mainLogger.child({ module: 'ForgePhoneRecovery' });
const exp = global.exports;

type Callback = (result: unknown) => void;

const deliver = <T>(operation: Promise<T>, callback?: Callback): Promise<T> | void => {
  const safe = operation.catch((error) => {
    logger.error(`Recovery export failed: ${error.message}`);
    return { success: false, error: 'INTERNAL_ERROR' } as T;
  });
  if (typeof callback === 'function') {
    safe.then(callback);
    return;
  }
  return safe;
};

exp('getOwnedPhoneDevices', (playerSource: number, callback?: Callback) =>
  deliver(PhoneRecoveryService.listOwned(Number(playerSource)), callback),
);

exp('cancelLostPhone', (playerSource: number, deviceId: string, callback?: Callback) =>
  deliver(PhoneRecoveryService.cancelLostPhone(Number(playerSource), deviceId), callback),
);

exp(
  'issueNewPhone',
  (
    playerSource: number,
    model?: string,
    color?: string,
    slotOrCallback?: number | Callback,
    callback?: Callback,
  ) => {
    const slot = typeof slotOrCallback === 'number' ? slotOrCallback : undefined;
    const resolvedCallback = typeof slotOrCallback === 'function' ? slotOrCallback : callback;
    return deliver(
      PhoneRecoveryService.issueNewPhone(Number(playerSource), model, color, slot),
      resolvedCallback,
    );
  },
);

exp(
  'issueReplacementPhone',
  (playerSource: number, oldDeviceId: string, slotOrCallback?: number | Callback, callback?: Callback) => {
    const slot = typeof slotOrCallback === 'number' ? slotOrCallback : undefined;
    const resolvedCallback = typeof slotOrCallback === 'function' ? slotOrCallback : callback;
    return deliver(
      PhoneRecoveryService.issueReplacement(Number(playerSource), oldDeviceId, slot),
      resolvedCallback,
    );
  },
);
