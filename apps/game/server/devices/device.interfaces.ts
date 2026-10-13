export type DeviceStatus = 'active' | 'blocked' | 'replaced';

export interface ForgeNPWDMetadataV1 {
  deviceId: string;
  profileId: string;
  lineId: string;
  serialNumber: string;
  phoneNumber: string;
  model: string;
  color: string;
  schemaVersion: number;
}

export interface PhoneItemData {
  name: string;
  slot: number;
  metadata?: Record<string, unknown>;
}

export interface DeviceIdentity extends ForgeNPWDMetadataV1 {
  registeredOwnerCitizenId: string;
  currentUserCitizenId: string | null;
  status: DeviceStatus;
}

export interface CreateDeviceIdentity extends ForgeNPWDMetadataV1 {
  registeredOwnerCitizenId: string;
}
