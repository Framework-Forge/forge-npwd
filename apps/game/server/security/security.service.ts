import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import {
  PHONE_PIN_MAX_LENGTH,
  PHONE_PIN_MIN_LENGTH,
  PhoneSecurityStatus,
} from '@typings/security';
import PlayerService from '../players/player.service';
import { DeviceRepo } from '../devices/device.database';
import { PhoneSecurityRecord, SecurityRepo, SecurityRepository } from './security.database';

const scrypt = promisify(scryptCallback);
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 5 * 60;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

interface SecuritySession {
  deviceId: string;
  expiresAt: number;
}

export class SecurityService {
  private readonly sessions = new Map<number, SecuritySession>();

  constructor(private readonly repository: SecurityRepository = SecurityRepo) {}

  private getDeviceId(source: number): string | null {
    return PlayerService.getPlayer(source)?.getActiveDeviceId() || null;
  }

  private validPin(pin: string): boolean {
    return new RegExp(`^\\d{${PHONE_PIN_MIN_LENGTH},${PHONE_PIN_MAX_LENGTH}}$`).test(pin);
  }

  private async hashPin(pin: string, salt: string): Promise<string> {
    const derived = (await scrypt(pin, salt, 64)) as Buffer;
    return derived.toString('hex');
  }

  private async matches(pin: string, record: PhoneSecurityRecord): Promise<boolean> {
    if (!record.pinHash || !record.pinSalt) return false;
    const expected = Buffer.from(record.pinHash, 'hex');
    const actual = Buffer.from(await this.hashPin(pin, record.pinSalt), 'hex');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private isLocked(record: PhoneSecurityRecord): boolean {
    return Boolean(record.lockedUntil && record.lockedUntil.getTime() > Date.now());
  }

  private toStatus(source: number, deviceId: string, record: PhoneSecurityRecord): PhoneSecurityStatus {
    const session = this.sessions.get(source);
    const unlocked = Boolean(
      record.pinHash &&
      session &&
      session.deviceId === deviceId &&
      session.expiresAt > Date.now() &&
      !this.isLocked(record),
    );
    return {
      configured: Boolean(record.pinHash && record.pinSalt),
      unlocked,
      attemptsRemaining: this.isLocked(record) ? 0 : Math.max(0, MAX_ATTEMPTS - record.failCount),
      lockedUntil: this.isLocked(record) ? record.lockedUntil?.getTime() || null : null,
      pinLength: record.pinLength,
    };
  }

  private unlock(source: number, deviceId: string): void {
    this.sessions.set(source, { deviceId, expiresAt: Date.now() + SESSION_TTL_MS });
  }

  async status(source: number): Promise<PhoneSecurityStatus | null> {
    await DeviceRepo.ensureSchema();
    const deviceId = this.getDeviceId(source);
    if (!deviceId) return null;
    const record = await this.repository.get(deviceId);
    return record ? this.toStatus(source, deviceId, record) : null;
  }

  async setup(source: number, pin: string): Promise<PhoneSecurityStatus | null> {
    if (!this.validPin(pin)) throw new Error('INVALID_PIN_FORMAT');
    await DeviceRepo.ensureSchema();
    const deviceId = this.getDeviceId(source);
    if (!deviceId) return null;
    const current = await this.repository.get(deviceId);
    if (!current || current.pinHash) throw new Error('PIN_ALREADY_CONFIGURED');
    const salt = randomBytes(16).toString('hex');
    if (!(await this.repository.setPin(deviceId, await this.hashPin(pin, salt), salt, pin.length))) return null;
    this.unlock(source, deviceId);
    return this.status(source);
  }

  async verify(source: number, pin: string): Promise<PhoneSecurityStatus | null> {
    if (!this.validPin(pin)) throw new Error('INVALID_PIN_FORMAT');
    await DeviceRepo.ensureSchema();
    const deviceId = this.getDeviceId(source);
    if (!deviceId) return null;
    const record = await this.repository.get(deviceId);
    if (!record || !record.pinHash || this.isLocked(record)) {
      return record ? this.toStatus(source, deviceId, record) : null;
    }
    if (!(await this.matches(pin, record))) {
      const failed = await this.repository.recordFailure(deviceId, MAX_ATTEMPTS, LOCK_SECONDS);
      if (!failed) return null;
      throw Object.assign(new Error('INVALID_PIN'), { status: this.toStatus(source, deviceId, failed) });
    }
    await this.repository.clearFailures(deviceId);
    this.unlock(source, deviceId);
    return this.status(source);
  }

  async change(source: number, currentPin: string, newPin: string): Promise<PhoneSecurityStatus | null> {
    if (!this.validPin(currentPin) || !this.validPin(newPin)) throw new Error('INVALID_PIN_FORMAT');
    await DeviceRepo.ensureSchema();
    const deviceId = this.getDeviceId(source);
    if (!deviceId) return null;
    const record = await this.repository.get(deviceId);
    if (!record || this.isLocked(record)) return record ? this.toStatus(source, deviceId, record) : null;
    if (!(await this.matches(currentPin, record))) {
      const failed = await this.repository.recordFailure(deviceId, MAX_ATTEMPTS, LOCK_SECONDS);
      if (failed && this.isLocked(failed)) this.lockSource(source);
      throw Object.assign(new Error('INVALID_CURRENT_PIN'), {
        status: failed ? this.toStatus(source, deviceId, failed) : undefined,
      });
    }
    const salt = randomBytes(16).toString('hex');
    if (!(await this.repository.setPin(deviceId, await this.hashPin(newPin, salt), salt, newPin.length))) return null;
    this.unlock(source, deviceId);
    return this.status(source);
  }

  lockSource(source: number): void {
    this.sessions.delete(source);
  }

  lockDevice(deviceId: string): void {
    for (const [source, session] of this.sessions) {
      if (session.deviceId === deviceId) this.sessions.delete(source);
    }
  }
}

export const PhoneSecurityService = new SecurityService();
