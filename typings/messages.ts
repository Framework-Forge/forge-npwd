export interface Message {
  id: number;
  message: string;
  conversation_id?: number;
  author: string;
  is_embed?: boolean;
  embed?: any;
  createdAt: number;
}

export interface PreDBMessage {
  conversationId: number;
  conversationList: string;
  tgtPhoneNumber: string;
  sourcePhoneNumber?: string;
  message?: string;
  is_embed?: boolean;
  embed?: any;
}

export interface CreateMessageDTO {
  userIdentifier: string;
  authorPhoneNumber: string;
  conversationId: number;
  message: string;
  is_embed: boolean;
  embed: any;
}

export interface MessageConversation {
  id: number;
  conversationList: string;
  label: string;
  participant?: string;
  isGroupChat: boolean;
  unread?: number;
  unreadCount?: number;
  updatedAt?: number;
}

export interface PreDBConversation {
  participants: string[];
  conversationLabel: string;
  isGroupChat: boolean;
}

export interface MessagesRequest {
  conversationId: string;
  page: number;
}

export interface DeleteConversationRequest {
  conversationsId: number[];
}

/**
 * Used for the raw npwd_messages_groups row responses
 */
export interface UnformattedMessageConversation {
  conversation_id: string;
  user_identifier: string;
  participant_identifier: string;
  phone_number: string;
  avatar?: string;
  display?: string;
  updatedAt?: string;
  unread: number;
}

/**
 * Used to help consolidate raw npwd_messages_groups rows into
 * a mapping of a single message group
 */
export interface MessageGroupMapping {
  [groupId: string]: {
    user_identifier: string;
    // Participant displays
    participants: string[];
    phoneNumbers: string[];
    label?: string;
    avatar?: string;
    updatedAt: string;
    unreadCount: number;
  };
}

export interface CreateMessageGroupResult {
  error?: boolean;
  phoneNumber?: string;
  duplicate?: boolean;
  conversationId?: string;
  mine?: boolean;
  participant: string;
  identifiers: string[];
  doesExist: UnformattedMessageConversation | null;
}

export interface CreateMessageBroadcast {
  message: string;
  groupName: string;
  groupId: string;
}

export interface SetMessageRead {
  groupId: string;
}

export interface MessageConversationResponse {
  conversation_id: number;
  phoneNumber: string;
  updatedAt: number;
  conversationList: string;
  label: string;
}

export interface OnMessageExportCtx {
  /**
   * The incoming message object
   */
  data: PreDBMessage;

  source: number;
}

export interface EmitMessageExportCtx {
  senderNumber: string;
  targetNumber: string;
  message: string;
  embed?: any;
}

export enum MessageEvents {
  FETCH_MESSAGE_CONVERSATIONS = 'forge-npwd:fetchMessageGroups',
  FETCH_MESSAGE_GROUPS_SUCCESS = 'forge-npwd:fetchMessageGroupsSuccess',
  FETCH_MESSAGE_GROUPS_FAILED = 'forge-npwd:fetchMessageGroupsFailed',
  CREATE_MESSAGE_CONVERSATION = 'forge-npwd:createMessageGroup',
  CREATE_MESSAGE_CONVERSATION_SUCCESS = 'forge-npwd:createMessageConversationSuccess',
  CREATE_MESSAGE_GROUP_SUCCESS = 'forge-npwd:createMessageGroupSuccess',
  CREATE_MESSAGE_GROUP_FAILED = 'forge-npwd:createMessageGroupFailed',
  SEND_MESSAGE = 'forge-npwd:sendMessage',
  SEND_EMBED_MESSAGE = 'forge-npwd:sendEmbedMessage',
  SEND_MESSAGE_SUCCESS = 'forge-npwd:sendMessageSuccess',
  SEND_MESSAGE_FAILED = 'forge-npwd:sendMessageFailed',
  DELETE_MESSAGE = 'forge-npwd:deleteMessage',
  FETCH_MESSAGES = 'forge-npwd:fetchMessages',
  FETCH_MESSAGES_SUCCESS = 'forge-npwd:fetchMessagesSuccess',
  FETCH_MESSAGES_FAILED = 'forge-npwd:fetchMessagesFailed',
  FETCH_INITIAL_MESSAGES = 'forge-npwd:fetchInitialMessages',
  ACTION_RESULT = 'forge-npwd:setMessagesAlert',
  CREATE_MESSAGE_BROADCAST = 'forge-npwd:createMessagesBroadcast',
  SET_MESSAGE_READ = 'forge-npwd:setReadMessages',
  DELETE_CONVERSATION = 'nwpd:deleteConversation',
  GET_MESSAGE_LOCATION = 'forge-npwd:getMessageLocation',
  MESSAGES_SET_WAYPOINT = 'forge-npwd:setWaypoint',
}

export interface Location {
  phoneNumber: string;
  coords: number[];
}
