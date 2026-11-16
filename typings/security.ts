export const PHONE_PIN_MIN_LENGTH = 4;
export const PHONE_PIN_MAX_LENGTH = 6;

export interface PhoneSecurityStatus {
  configured: boolean;
  unlocked: boolean;
  attemptsRemaining: number;
  lockedUntil: number | null;
  pinLength: number | null;
}

export interface SetupPinRequest {
  pin: string;
}

export interface VerifyPinRequest {
  pin: string;
}

export interface ChangePinRequest {
  currentPin: string;
  newPin: string;
}

export enum SecurityEvents {
  STATUS = 'forge-npwd:security:status',
  SETUP_PIN = 'forge-npwd:security:setup-pin',
  VERIFY_PIN = 'forge-npwd:security:verify-pin',
  CHANGE_PIN = 'forge-npwd:security:change-pin',
  LOCK_SESSION = 'forge-npwd:security:lock-session',
  REFRESH_UI = 'forge-npwd:security:refresh-ui',
}
