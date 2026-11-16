export type AlertCategory =
  | 'CONTACT_ADD_SUCCESS'
  | 'CONTACT_ADD_FAILED'
  | 'CONTACT_UPDATE_SUCCESS'
  | 'CONTACT_UPDATE_FAILED'
  | 'CONTACT_DELETE_SUCCESS'
  | 'CONTACT_DELETE_FAILED';

export interface PreDBContact {
  display: string;
  number: string;
  avatar?: string;
}

export interface Contact extends PreDBContact {
  id: number | string;
}

export interface ContactPay {
  number: string;
  amount: number;
}

export interface ContactDeleteDTO {
  id: number;
}

export enum ContactResp {
  ADD_FAILED = 'CONTACT.FEEDBACK.ADD_FAILED',
  UPDATE_FAILED = 'CONTACT.FEEDBACK.UPDATE_FAILED',
  INVALID_HOST = 'GENERIC_INVALID_IMAGE_HOST',
}

export enum ContactsDatabaseLimits {
  avatar = 255,
  number = 20,
  display = 255,
}

export enum ContactEvents {
  PAY_CONTACT = 'forge-npwd-contact-pay',
  GET_CONTACTS = 'forge-npwd-contact-getAll',
  ADD_CONTACT = 'forge-npwd-contact-add',
  UPDATE_CONTACT = 'forge-npwd:updateContact',
  DELETE_CONTACT = 'forge-npwd:deleteContact',
  // Used to fill in information through an export event
  ADD_CONTACT_EXPORT = 'forge-npwd:addContactExport',
  LOCAL_SHARE = 'forge-npwd:localShareContact'
}

export interface AddContactExportData {
  name?: string;
  number: string;
  avatar?: string;
}
