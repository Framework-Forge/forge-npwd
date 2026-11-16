export interface ChannelItemProps {
  id: number;
  label: string;
  identifier: string;
  lastMessage?: string;
  owner?: string;
}

// TODO: images
export interface RawChannelMessageProps {
  id: number;
  message: string;
  identifier: string;
  createdAt: string;
}

export interface ChannelMessageProps {
  id: number;
  message: string;
  identifier: string;
  createdAt: number;
  isMine: boolean;
  channelId?: number;
  isImage: boolean;
}

export type JoinChannelDTO = {
  channelIdentifier: string;
  label?: string;
};

export type MessageDTO = {
  channelId: number;
  phoneNumber: string;
  message: string;
  type: string;
};

export type ChannelMember = {
  isOwner?: boolean;
  channelId: number;
  identifier: string;
  phoneNumber?: string;
};

export type OwnerTransferReq = {
  userIdentifier: string;
  channelId: number;
  newOwnerPhoneNumber;
};

export type OwnerTransferResp = {
  ownerPhoneNumber: string;
  channelId: number;
};

export type UpdateLabelDto = {
  channelId: number;
  label: string;
};

export enum DarkchatEvents {
  ADD_CHANNEL = 'forge-npwd:darkchatAddChannel',
  LEAVE_CHANNEL = 'forge-npwd:darkchatLeaveChannel',
  DELETE_CHANNEL = 'forge-npwd:darkchatDeleteChannel',
  DELETE_CHANNEL_SUCCESS = 'forge-npwd:darkchatDeleteChannelSuccess',
  FETCH_MEMBERS = 'forge-npwd:darkchatFetchMembers',
  TRANSFER_OWNERSHIP = 'forge-npwd:darkchatTransferOwnership',
  TRANSFER_OWNERSHIP_SUCCESS = 'forge-npwd:darkchatTransferOwnershipSuccess',
  FETCH_MESSAGES = 'forge-npwd:darkchatFetchMessages',
  FETCH_CHANNELS = 'forge-npwd:darkchatFetchChannels',
  BROADCAST_MESSAGE = 'forge-npwd:darkchatBroadcastMessage',
  BROADCAST_LABEL_UPDATE = 'forge-npwd:darkchatBroadcastLabelUpdate',
  SEND_MESSAGE = 'forge-npwd:darkchatSendMessage',
  UPDATE_CHANNEL_LABEL = 'forge-npwd:darkchatUpdateChannelLabel',
}
