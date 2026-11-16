export const PHONE_NUMBER_REGEX = /^([0-9]{3}-[0-9]{4})|([0-9]{7})$/;
export interface ScriptMessage<T = any> {
  method: string;
  app: string;
  data: T;
}

export enum PhoneEvents {
  OPEN_APP = 'forge-npwd:openApp',
  OPEN_PHONE = 'forge-npwd:open',
  CLOSE_PHONE = 'forge-npwd:close',
  UNLOAD_CHARACTER = 'forge-npwd:unloadCharacter',
  SET_VISIBILITY = 'forge-npwd:setVisibility',
  ADD_SNACKBAR_ALERT = 'forge-npwd:setSnackarAlert',
  SET_NUMBER = 'forge-npwd:setNumber',
  SET_PHONE_READY = 'forge-npwd:phoneReady',
  SET_CONFIG = 'forge-npwd:setPhoneConfig',
  SET_TIME = 'forge-npwd:setGameTime',
  SEND_CREDENTIALS = 'forge-npwd:sendCredentials',
  FETCH_CREDENTIALS = 'forge-npwd:getCredentials',
  TOGGLE_KEYS = 'forge-npwd:toggleAllControls',
  SET_PLAYER_LOADED = 'forge-npwd:setPlayerLoaded',
  IS_PHONE_DISABLED = 'forge-npwd:isPhoneDisabled',
  SEND_PLAYER_SOURCE = 'forge-npwd:sendPlayerSource',
  SEND_PLAYER_IDENTIFIER = 'forge-npwd:sendPlayerIdentifier',
  GET_PHONE_NUMBER = 'forge-npwd:getPhoneNumber',
}

// Used to standardize the server response
export enum ErrorStringKeys {
  SERVER_ERROR = 'GENERAL_SERVER_ERROR',
  DELETE_FAILED = 'DELETE_FAILED',
  ADD_FAILED = 'ADD_FAILED',
  UPDATE_FAILED = 'UPDATED_FAILED',
  FETCH_FAILED = 'FETCH_FAILED',
}

export interface FxServerRespError {
  errorCode: ErrorStringKeys;
  message: string;
}

export interface FxServerResponse {
  data?: unknown;
  action: string;
  status: 'success' | 'failure';
  app: string;
  error?: FxServerRespError;
}
