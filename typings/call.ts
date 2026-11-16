export interface ActiveCall {
  is_accepted: boolean;
  isTransmitter: boolean;
  transmitter: string;
  receiver: string;
  channelId?: number;
  isUnavailable?: boolean;
  start?: string;
  isAnonymous?: boolean;
}

export interface InitializeCallDTO {
  receiverNumber: string;
  isAnonymous: boolean;
}

export interface StartCallEventData {
  transmitter: string;
  receiver: string;
  isTransmitter: boolean;
  isUnavailable?: boolean;
}

export interface EndCallDTO {
  transmitterNumber: string;
  isTransmitter: boolean;
  isUnavailable: boolean;
}

export interface TransmitterNumDTO {
  transmitterNumber: string;
}

export interface CallWasAcceptedEvent {
  channelId: number;
  currentCall: CallHistoryItem;
  isTransmitter: boolean;
}

export interface ActiveCallRaw {
  identifier: string;
  transmitter: string;
  transmitterSource: number;
  receiver: string;
  receiverSource: number;
  start: string;
  is_accepted: boolean;
  isAnonymous: boolean;
}

export interface CallHistoryItem {
  id?: number | string;
  identifier?: string;
  transmitter: string;
  transmitterSource?: number;
  receiver: string;
  receiverSource?: number;
  start: string;
  end?: number;
  is_accepted: boolean;
  isAnonymous?: boolean;
}

export enum CallRejectReasons {
  DECLINED,
  BUSY_LINE,
}

export enum CallEvents {
  INITIALIZE_CALL = 'forge-npwd:beginCall',
  START_CALL = 'forge-npwd:startCall',
  ACCEPT_CALL = 'forge-npwd:acceptCall',
  END_CALL = 'forge-npwd:endCall',
  WAS_ENDED = 'forge-npwd:callEnded',
  WAS_ACCEPTED = 'forge-npwd:callAccepted',
  REJECTED = 'forge-npwd:rejectCall',
  WAS_REJECTED = 'forge-npwd:callRejected',
  FETCH_CALLS = 'forge-npwd:fetchCalls',
  SET_CALL_INFO = 'forge-npwd:setCaller',
  SET_CALL_MODAL = 'forge-npwd:callModal',
  SEND_ALERT = 'forge-npwd:callSetAlert',
  SAVE_CALL = 'forge-npwd:saveCall',
  TOGGLE_MUTE_CALL = 'forge-npwd:toggleMuteCall',
}

export interface IncomingCallerCtx {
  source: number;
  number: string;
  name: string;
}

export interface OnCallExportCtx {
  incomingCaller: IncomingCallerCtx;
  receiverNumber: string
  exit: () => void;
  next: () => void;
  reply: (msg: string) => void;
  forward: (tgt: string) => void;
}

export type CallMiddlewareInvokable = (ctx: OnCallExportCtx) => void;

export enum OnCallStatus {
  NEXT,
  FORWARD
}