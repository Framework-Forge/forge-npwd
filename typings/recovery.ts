export interface OwnedPhoneDevice {
  deviceId: string;
  serialNumber: string;
  phoneNumber: string;
  model: string;
  color: string;
  status: 'active' | 'blocked' | 'replaced';
  currentUserCitizenId: string | null;
  replacedByDeviceId: string | null;
}

export interface RecoveryResult {
  success: boolean;
  error?: string;
  oldDeviceId?: string;
  newDeviceId?: string;
  serialNumber?: string;
  phoneNumber?: string;
  profileId?: string;
  lineId?: string;
}
