interface IAlertProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}
declare enum AlertEvents {
    PLAY_ALERT = "forge-npwd:playAlert"
}

interface IBankCredentials {
    name: string;
    balance: number;
}
interface Transfer {
    id: number;
    targetID: number;
    source: string;
    type: string;
    transferAmount: number;
    message: string;
}
interface ITransactions {
    source: number;
    type: string;
    amount: number;
}
declare enum BankEvents {
    ADD_TRANSFER = "forge-npwd:addTransfer",
    ADD_TRANSFER_SUCCESS = "forge-npwd:addTransferSuccess",
    FETCH_TRANSACTIONS = "forge-npwd:fetchAllTransactions",
    SEND_TRANSFERS = "forge-npwd:sendTransfers",
    TRANSACTION_ALERT = "forge-npwd:bankTransactionAlert",
    TRANSACTION_NOTIFICATION = "forge-npwd:bankTransactionNotification",
    SEND_CREDENTIALS = "forge-npwd:sendBankCredentials",
    GET_CREDENTIALS = "forge-npwd:getBankCredentials",
    SEND_ALERT = "forge-npwd:sendBankAlert",
    SEND_NOTIFICATION = "forge-npwd:sendBankNotification"
}

interface ActiveCall {
    is_accepted: boolean;
    isTransmitter: boolean;
    transmitter: string;
    receiver: string;
    channelId?: number;
    isUnavailable?: boolean;
    start?: string;
    isAnonymous?: boolean;
}
interface InitializeCallDTO {
    receiverNumber: string;
    isAnonymous: boolean;
}
interface StartCallEventData {
    transmitter: string;
    receiver: string;
    isTransmitter: boolean;
    isUnavailable?: boolean;
}
interface EndCallDTO {
    transmitterNumber: string;
    isTransmitter: boolean;
    isUnavailable: boolean;
}
interface TransmitterNumDTO {
    transmitterNumber: string;
}
interface CallWasAcceptedEvent {
    channelId: number;
    currentCall: CallHistoryItem;
    isTransmitter: boolean;
}
interface ActiveCallRaw {
    identifier: string;
    transmitter: string;
    transmitterSource: number;
    receiver: string;
    receiverSource: number;
    start: string;
    is_accepted: boolean;
    isAnonymous: boolean;
}
interface CallHistoryItem {
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
declare enum CallRejectReasons {
    DECLINED = 0,
    BUSY_LINE = 1
}
declare enum CallEvents {
    INITIALIZE_CALL = "forge-npwd:beginCall",
    START_CALL = "forge-npwd:startCall",
    ACCEPT_CALL = "forge-npwd:acceptCall",
    END_CALL = "forge-npwd:endCall",
    WAS_ENDED = "forge-npwd:callEnded",
    WAS_ACCEPTED = "forge-npwd:callAccepted",
    REJECTED = "forge-npwd:rejectCall",
    WAS_REJECTED = "forge-npwd:callRejected",
    FETCH_CALLS = "forge-npwd:fetchCalls",
    SET_CALL_INFO = "forge-npwd:setCaller",
    SET_CALL_MODAL = "forge-npwd:callModal",
    SEND_ALERT = "forge-npwd:callSetAlert",
    SAVE_CALL = "forge-npwd:saveCall",
    TOGGLE_MUTE_CALL = "forge-npwd:toggleMuteCall"
}
interface IncomingCallerCtx {
    source: number;
    number: string;
    name: string;
}
interface OnCallExportCtx {
    incomingCaller: IncomingCallerCtx;
    receiverNumber: string;
    exit: () => void;
    next: () => void;
    reply: (msg: string) => void;
    forward: (tgt: string) => void;
}
type CallMiddlewareInvokable = (ctx: OnCallExportCtx) => void;
declare enum OnCallStatus {
    NEXT = 0,
    FORWARD = 1
}

interface ServerPromiseResp<T = undefined> {
    errorMsg?: string;
    status: 'ok' | 'error';
    data?: T;
}
type Spread<T1, T2> = {
    [K in Exclude<keyof T1, keyof T2>]: T1[K];
} & T2;

interface TwitterConfig {
    showNotifications: boolean;
    generateProfileNameFromUsers: boolean;
    allowEditableProfileName: boolean;
    allowDeleteTweets: boolean;
    allowReportTweets: boolean;
    allowRetweet: boolean;
    characterLimit: number;
    newLineLimit: number;
    enableAvatars: boolean;
    enableEmojis: boolean;
    enableImages: boolean;
    maxImages: number;
    resultsLimit: number;
}
interface MatchConfig {
    generateProfileNameFromUsers: boolean;
    allowEditableProfileName: boolean;
}
interface MarketplaceConfig {
    persistListings: boolean;
}
interface Debug {
    level: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
    enabled: boolean;
    sentryEnabled: true;
}
interface General {
    useResourceIntegration: boolean;
    toggleKey: string;
    toggleCommand: string;
    defaultLanguage: string;
    showId: boolean;
    phoneNumberFormat: string;
}
interface Contacts {
    frameworkPay: boolean;
    payResource: string;
    payFunction: string;
}
interface NotificationConfig {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'bottom' | 'top';
}
interface BankConfig {
    showNotifications: boolean;
}
interface DatabaseConfig {
    playerTable: string;
    identifierColumn: string;
    identifierType: string;
    useIdentifierPrefix: boolean;
    profileQueries: boolean;
    phoneNumberColumn: string;
}
interface ImageSafety {
    filterUnsafeImageUrls: boolean;
    embedUnsafeImages: boolean;
    embedUrl: string;
    safeImageUrls: string[];
}
interface ImageConfig {
    url: string;
    type: string;
    imageEncoding: 'png' | 'jpg' | 'webp';
    contentType: string;
    useContentType: boolean;
    useWebhook: boolean;
    authorizationHeader: string;
    authorizationPrefix: string;
    useAuthorization: boolean;
    returnedDataIndexes: Array<any>;
}
interface PhoneAsItemConfig {
    enabled: boolean;
    exportResource: string;
    exportFunction: string;
}
interface CustomNumberConfig {
    enabled: boolean;
    exportResource: string;
    exportFunction: string;
}
interface DeviceConfig {
    enabled: boolean;
    itemName: string;
    defaultModel: string;
    defaultColor: string;
    metadataSchemaVersion: number;
    mirrorLegacyPhoneNumber: boolean;
}
interface ProfanityFilter {
    enabled: boolean;
    badWords: string[];
}
interface VoiceMessageConfig {
    enabled: boolean;
    token: string;
    url: string;
    authorizationHeader: string;
    authorizationPrefix: string;
    returnedDataIndexes: Array<any>;
}
interface DefaultContact {
    display: string;
    number: string;
    avatar?: string;
}
interface BrowserConfig {
    homepageUrl: string;
}
interface ResourceConfig {
    database: DatabaseConfig;
    Locale: string;
    PhoneAsItem: PhoneAsItemConfig;
    customPhoneNumber: CustomNumberConfig;
    device: DeviceConfig;
    RunRate: number;
    twitter: TwitterConfig;
    match: MatchConfig;
    marketplace: MarketplaceConfig;
    bank: BankConfig;
    notificationPosition: NotificationConfig;
    defaultContacts: DefaultContact[];
    general: General;
    browser: BrowserConfig;
    debug: Debug;
    images: ImageConfig;
    imageSafety: ImageSafety;
    disabledApps: string[];
    profanityFilter: ProfanityFilter;
    apps: string[];
    voiceMessage: VoiceMessageConfig;
    contacts: Contacts;
}

type AlertCategory = 'CONTACT_ADD_SUCCESS' | 'CONTACT_ADD_FAILED' | 'CONTACT_UPDATE_SUCCESS' | 'CONTACT_UPDATE_FAILED' | 'CONTACT_DELETE_SUCCESS' | 'CONTACT_DELETE_FAILED';
interface PreDBContact {
    display: string;
    number: string;
    avatar?: string;
}
interface Contact extends PreDBContact {
    id: number | string;
}
interface ContactPay {
    number: string;
    amount: number;
}
interface ContactDeleteDTO {
    id: number;
}
declare enum ContactResp {
    ADD_FAILED = "CONTACT.FEEDBACK.ADD_FAILED",
    UPDATE_FAILED = "CONTACT.FEEDBACK.UPDATE_FAILED",
    INVALID_HOST = "GENERIC_INVALID_IMAGE_HOST"
}
declare enum ContactsDatabaseLimits {
    avatar = 255,
    number = 20,
    display = 255
}
declare enum ContactEvents {
    PAY_CONTACT = "forge-npwd-contact-pay",
    GET_CONTACTS = "forge-npwd-contact-getAll",
    ADD_CONTACT = "forge-npwd-contact-add",
    UPDATE_CONTACT = "forge-npwd:updateContact",
    DELETE_CONTACT = "forge-npwd:deleteContact",
    ADD_CONTACT_EXPORT = "forge-npwd:addContactExport",
    LOCAL_SHARE = "forge-npwd:localShareContact"
}
interface AddContactExportData {
    name?: string;
    number: string;
    avatar?: string;
}

interface MarketplaceListing extends MarketplaceListingBase {
    id: number;
    identifier?: string;
    username: string;
    name: string;
    number: string;
}
interface MarketplaceListingBase {
    title: string;
    url: string;
    description: string;
}
declare enum MarketplaceDatabaseLimits {
    title = 255,
    description = 255,
    url = 255
}
declare enum MarketplaceResp {
    CREATE_FAILED = "MARKETPLACE.FEEDBACK.CREATE_LISTING_FAILED",
    DUPLICATE = "MARKETPLACE.FEEDBACK.DUPLICATE_LISTING",
    INVALID_IMAGE_HOST = "GENERIC_INVALID_IMAGE_HOST"
}
declare enum MarketplaceEvents {
    ADD_LISTING = "forge-npwd:addListing",
    FETCH_LISTING = "forge-npwd:fetchAllListings",
    DELETE_LISTING = "forge-npwd:marketplaceDeleteListing",
    DELETE_LISTINGS_ON_DROP = "forge-npwd:marketplaceDeleteListingsOnDrop",
    REPORT_LISTING = "forge-npwd:reportListing",
    BROADCAST_ADD = "forge-npwd:sendMarketplaceBroadcastAdd",
    BROADCAST_DELETE = "forge-npwd:sendMarketplaceBroadcastDelete"
}
interface MarketplaceBroadcastAddDTO {
    listing: MarketplaceListing;
}
interface MarketplaceDeleteDTO {
    id: number;
}
interface MarketplaceReportDTO {
    id: number;
}
type ReportListingDTO = {
    id: number;
    title: string;
    description: string;
    url: string;
};

interface NewProfile {
    name: string;
    image: string;
    bio: string;
    job: string;
    location: string;
    tags: string;
    voiceMessage?: string | null;
}
interface Profile extends NewProfile {
    id: number;
    identifier: string;
    phoneNumber: string;
    viewed: boolean;
    createdAt: number;
    updatedAt: number;
    lastActive: number;
}
interface FormattedProfile extends Profile {
    lastActiveFormatted: string;
    tagList: string[];
}
interface Match extends Profile {
    matchedAt: number;
}
interface FormattedMatch extends FormattedProfile {
    matchedAtFormatted: string;
}
interface Like {
    id: number;
    liked: boolean;
}
interface CreateMatchBroadcast {
    name: string;
}
declare enum MatchResp {
    UPDATE_FAILED = "MATCH.FEEDBACK.UPDATE_PROFILE_FAILED"
}
declare enum MatchEvents {
    INITIALIZE = "phone:initializeMatch",
    GET_PROFILES = "phone:getMatchProfiles",
    CREATE_MY_PROFILE = "phone:createMyProfile",
    GET_MY_PROFILE = "phone:getMyProfile",
    UPDATE_MY_PROFILE = "phone:updateMyProfile",
    GET_MATCHES = "phone:getMatches",
    SAVE_LIKES = "phone:saveLikes",
    SAVE_LIKES_BROADCAST = "phone:saveLikesBroadcast",
    CREATE_MATCH_ACCOUNT_BROADCAST = "phone:matchAccountBroadcast"
}

interface Message {
    id: number;
    message: string;
    conversation_id?: number;
    author: string;
    is_embed?: boolean;
    embed?: any;
    createdAt: number;
}
interface PreDBMessage {
    conversationId: number;
    conversationList: string;
    tgtPhoneNumber: string;
    sourcePhoneNumber?: string;
    message?: string;
    is_embed?: boolean;
    embed?: any;
}
interface CreateMessageDTO {
    userIdentifier: string;
    authorPhoneNumber: string;
    conversationId: number;
    message: string;
    is_embed: boolean;
    embed: any;
}
interface MessageConversation {
    id: number;
    conversationList: string;
    label: string;
    participant?: string;
    isGroupChat: boolean;
    unread?: number;
    unreadCount?: number;
    updatedAt?: number;
}
interface PreDBConversation {
    participants: string[];
    conversationLabel: string;
    isGroupChat: boolean;
}
interface MessagesRequest {
    conversationId: string;
    page: number;
}
interface DeleteConversationRequest {
    conversationsId: number[];
}
/**
 * Used for the raw npwd_messages_groups row responses
 */
interface UnformattedMessageConversation {
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
interface MessageGroupMapping {
    [groupId: string]: {
        user_identifier: string;
        participants: string[];
        phoneNumbers: string[];
        label?: string;
        avatar?: string;
        updatedAt: string;
        unreadCount: number;
    };
}
interface CreateMessageGroupResult {
    error?: boolean;
    phoneNumber?: string;
    duplicate?: boolean;
    conversationId?: string;
    mine?: boolean;
    participant: string;
    identifiers: string[];
    doesExist: UnformattedMessageConversation | null;
}
interface CreateMessageBroadcast {
    message: string;
    groupName: string;
    groupId: string;
}
interface SetMessageRead {
    groupId: string;
}
interface MessageConversationResponse {
    conversation_id: number;
    phoneNumber: string;
    updatedAt: number;
    conversationList: string;
    label: string;
}
interface OnMessageExportCtx {
    /**
     * The incoming message object
     */
    data: PreDBMessage;
    source: number;
}
interface EmitMessageExportCtx {
    senderNumber: string;
    targetNumber: string;
    message: string;
    embed?: any;
}
declare enum MessageEvents {
    FETCH_MESSAGE_CONVERSATIONS = "forge-npwd:fetchMessageGroups",
    FETCH_MESSAGE_GROUPS_SUCCESS = "forge-npwd:fetchMessageGroupsSuccess",
    FETCH_MESSAGE_GROUPS_FAILED = "forge-npwd:fetchMessageGroupsFailed",
    CREATE_MESSAGE_CONVERSATION = "forge-npwd:createMessageGroup",
    CREATE_MESSAGE_CONVERSATION_SUCCESS = "forge-npwd:createMessageConversationSuccess",
    CREATE_MESSAGE_GROUP_SUCCESS = "forge-npwd:createMessageGroupSuccess",
    CREATE_MESSAGE_GROUP_FAILED = "forge-npwd:createMessageGroupFailed",
    SEND_MESSAGE = "forge-npwd:sendMessage",
    SEND_EMBED_MESSAGE = "forge-npwd:sendEmbedMessage",
    SEND_MESSAGE_SUCCESS = "forge-npwd:sendMessageSuccess",
    SEND_MESSAGE_FAILED = "forge-npwd:sendMessageFailed",
    DELETE_MESSAGE = "forge-npwd:deleteMessage",
    FETCH_MESSAGES = "forge-npwd:fetchMessages",
    FETCH_MESSAGES_SUCCESS = "forge-npwd:fetchMessagesSuccess",
    FETCH_MESSAGES_FAILED = "forge-npwd:fetchMessagesFailed",
    FETCH_INITIAL_MESSAGES = "forge-npwd:fetchInitialMessages",
    ACTION_RESULT = "forge-npwd:setMessagesAlert",
    CREATE_MESSAGE_BROADCAST = "forge-npwd:createMessagesBroadcast",
    SET_MESSAGE_READ = "forge-npwd:setReadMessages",
    DELETE_CONVERSATION = "nwpd:deleteConversation",
    GET_MESSAGE_LOCATION = "forge-npwd:getMessageLocation",
    MESSAGES_SET_WAYPOINT = "forge-npwd:setWaypoint"
}
interface Location {
    phoneNumber: string;
    coords: number[];
}

type NotesAlertCategory = 'NOTES_ADD_SUCCESS' | 'NOTES_ADD_FAILED' | 'NOTES_UPDATE_SUCCESS' | 'NOTES_UPDATE_FAILED' | 'NOTES_DELETE_SUCCESS' | 'NOTES_DELETE_FAILED';
interface INotesAlert {
    alert: NotesAlertCategory;
    setAlert: (type: NotesAlertCategory) => void;
}
interface BeforeDBNote {
    title: string;
    content: string;
}
interface NoteItem extends BeforeDBNote {
    id: number;
    title: string;
    content: string;
}
interface DeleteNoteDTO {
    id: number;
}
declare enum NotesEvents {
    ADD_NOTE = "forge-npwd:addNote",
    FETCH_ALL_NOTES = "forge-npwd:fetchAllNotes",
    DELETE_NOTE = "forge-npwd:deleteNote",
    UPDATE_NOTE = "forge-npwd:updateNote",
    ADD_NOTE_EXPORT = "forge-npwd:addNoteExport"
}
interface AddNoteExportData {
    title?: string;
    content?: string;
}

declare const PHONE_NUMBER_REGEX: RegExp;
interface ScriptMessage<T = any> {
    method: string;
    app: string;
    data: T;
}
declare enum PhoneEvents {
    OPEN_APP = "forge-npwd:openApp",
    OPEN_PHONE = "forge-npwd:open",
    CLOSE_PHONE = "forge-npwd:close",
    UNLOAD_CHARACTER = "forge-npwd:unloadCharacter",
    SET_VISIBILITY = "forge-npwd:setVisibility",
    ADD_SNACKBAR_ALERT = "forge-npwd:setSnackarAlert",
    SET_NUMBER = "forge-npwd:setNumber",
    SET_PHONE_READY = "forge-npwd:phoneReady",
    SET_CONFIG = "forge-npwd:setPhoneConfig",
    SET_TIME = "forge-npwd:setGameTime",
    SEND_CREDENTIALS = "forge-npwd:sendCredentials",
    FETCH_CREDENTIALS = "forge-npwd:getCredentials",
    TOGGLE_KEYS = "forge-npwd:toggleAllControls",
    SET_PLAYER_LOADED = "forge-npwd:setPlayerLoaded",
    IS_PHONE_DISABLED = "forge-npwd:isPhoneDisabled",
    SEND_PLAYER_SOURCE = "forge-npwd:sendPlayerSource",
    SEND_PLAYER_IDENTIFIER = "forge-npwd:sendPlayerIdentifier",
    GET_PHONE_NUMBER = "forge-npwd:getPhoneNumber"
}
declare enum ErrorStringKeys {
    SERVER_ERROR = "GENERAL_SERVER_ERROR",
    DELETE_FAILED = "DELETE_FAILED",
    ADD_FAILED = "ADD_FAILED",
    UPDATE_FAILED = "UPDATED_FAILED",
    FETCH_FAILED = "FETCH_FAILED"
}
interface FxServerRespError {
    errorCode: ErrorStringKeys;
    message: string;
}
interface FxServerResponse {
    data?: unknown;
    action: string;
    status: 'success' | 'failure';
    app: string;
    error?: FxServerRespError;
}

interface GalleryPhoto {
    image: string;
    id: number;
}
declare enum PhotoResp {
    GENERIC = "CAMERA.FAILED_TO_TAKE_PHOTO",
    INVALID_IMAGE_HOST = "GENERIC_INVALID_IMAGE_HOST"
}
declare enum PhotoEvents {
    TAKE_PHOTO = "forge-npwd:TakePhoto",
    CAMERA_EXITED = "forge-npwd:cameraExited",
    ForgeNPWD_PHOTO_MODE_STARTED = "forge-npwd:PhotoModeStarted",
    ForgeNPWD_PHOTO_MODE_ENDED = "forge-npwd:PhotoModeEnded",
    TAKE_PHOTO_SUCCESS = "forge-npwd:TakePhotoSuccess",
    SAVE_IMAGE = "forge-npwd:saveImage",
    UPLOAD_PHOTO = "forge-npwd:UploadPhoto",
    FETCH_PHOTOS = "forge-npwd:FetchPhotos",
    DELETE_PHOTO = "forge-npwd:deletePhoto",
    DELETE_MULTIPLE_PHOTOS = "forge-npwd:deleteMultiplePhotos",
    GET_AUTHORISATION_TOKEN = "forge-npwd:getAuthToken"
}

interface NewTweet {
    message: string;
    images?: string;
    retweet?: number;
}
type SETTING_MENTIONS = 'mentions';
type SETTINGS_ALL_TWEETS = 'all';
interface Tweet extends NewTweet {
    profile_name: string;
    profile_id: number;
    id: number;
    identifier: string;
    isMine: boolean;
    isLiked: boolean;
    isReported: boolean;
    avatar_url: string;
    isRetweet: number | boolean;
    likes: number;
    isRetweetedByPlayer?: boolean;
    retweetIdentifier: string;
    retweetId: string;
    seconds_since_tweet: number;
    retweetProfileName: string;
    retweetAvatarUrl: string;
    createdAt: string;
    updatedAt: string;
}
interface GetTweet extends NewTweet {
    profile_name: string;
    profile_id: number;
    id: number;
    identifier: string;
    isMine: boolean;
    isLiked: boolean;
    isReported: boolean;
    avatar_url: string;
    isRetweet: number | boolean;
    likes: number;
    isRetweetedByPlayer?: boolean;
    retweetIdentifier: string;
    retweetId: string;
    seconds_since_tweet: number;
    retweetProfileName: string;
    retweetAvatarUrl: string;
    createdAt: string;
    updatedAt: string;
}
interface Image {
    id: string;
    link: string;
}
interface FormattedTweet extends Omit<Tweet, 'images'> {
    images: Image[];
}
interface TwitterProfile {
    id: number;
    profile_name: string;
    identifier: string;
    avatar_url?: string;
    createdAt: string;
    updatedAt: string;
}
interface UpdateProfileProps {
    avatar_url: string;
    profile_name: string;
}
declare enum TwitterEvents {
    FETCH_TWEETS = "forge-npwd:fetchTweets",
    FETCH_TWEETS_FILTERED = "forge-npwd:fetchTweetsFiltered",
    CREATE_PROFILE = "forge-npwd:createTwitterProfile",
    GET_OR_CREATE_PROFILE = "forge-npwd:getOrCreateTwitterProfile",
    UPDATE_PROFILE = "forge-npwd:updateTwitterProfile",
    CREATE_TWEET = "forge-npwd:createTweet",
    CREATE_TWEET_BROADCAST = "createTweetBroadcast",
    DELETE_TWEET = "forge-npwd:deleteTweet",
    DELETE_TWEET_BROADCAST = "forge-npwd:deleteTweetBroadcast",
    TOGGLE_LIKE = "forge-npwd:toggleLike",
    RETWEET = "forge-npwd:retweet",
    REPORT = "forge-npwd:reportTweet",
    TWEET_LIKED_BROADCAST = "forge-npwd:tweetLikedBroadcast"
}

interface IconSetObject {
    custom: boolean;
    name: string;
}
interface SettingOption<T = any> {
    label: string;
    value: T | string | number;
}
declare enum KvpItems {
    ForgeNPWD_RINGTONE = "forge-npwd-ringtone",
    ForgeNPWD_NOTIFICATION = "forge-npwd-notification",
    ForgeNPWD_FRAME = "forge-npwd-frame"
}
type IPhoneLocalStorage = {
    [key: string]: IPhoneSettings;
};
interface IPhoneSettings {
    language: SettingOption;
    iconSet: SettingOption<IconSetObject>;
    wallpaper: SettingOption;
    frame: SettingOption;
    theme: SettingOption;
    zoom: SettingOption;
    streamerMode: boolean;
    anonymousMode: boolean;
    ringtone: SettingOption;
    callVolume: number;
    notiSound: SettingOption;
    TWITTER_notiFilter: SettingOption<SETTING_MENTIONS | SETTINGS_ALL_TWEETS>;
    TWITTER_notiSound: SettingOption;
    TWITTER_notiSoundVol: number;
    TWITTER_notifyNewFeedTweet: boolean;
    MARKETPLACE_notifyNewListing: boolean;
}
declare enum SettingEvents {
    NUI_SETTINGS_UPDATED = "forge-npwd:nuiSettingsUpdated",
    PREVIEW_ALERT = "forge-npwd:previewAlert",
    PREVIEW_RINGTONE = "forge-npwd:previewRingtone"
}

export { ActiveCall, ActiveCallRaw, AddContactExportData, AddNoteExportData, AlertCategory, AlertEvents, BankEvents, BeforeDBNote, BrowserConfig, CallEvents, CallHistoryItem, CallMiddlewareInvokable, CallRejectReasons, CallWasAcceptedEvent, Contact, ContactDeleteDTO, ContactEvents, ContactPay, ContactResp, ContactsDatabaseLimits, CreateMatchBroadcast, CreateMessageBroadcast, CreateMessageDTO, CreateMessageGroupResult, DefaultContact, DeleteConversationRequest, DeleteNoteDTO, EmitMessageExportCtx, EndCallDTO, ErrorStringKeys, FormattedMatch, FormattedProfile, FormattedTweet, FxServerRespError, FxServerResponse, GalleryPhoto, GetTweet, IAlertProps, IBankCredentials, INotesAlert, IPhoneLocalStorage, IPhoneSettings, ITransactions, IconSetObject, Image, IncomingCallerCtx, InitializeCallDTO, KvpItems, Like, Location, MarketplaceBroadcastAddDTO, MarketplaceDatabaseLimits, MarketplaceDeleteDTO, MarketplaceEvents, MarketplaceListing, MarketplaceListingBase, MarketplaceReportDTO, MarketplaceResp, Match, MatchEvents, MatchResp, Message, MessageConversation, MessageConversationResponse, MessageEvents, MessageGroupMapping, MessagesRequest, NewProfile, NewTweet, NoteItem, NotesAlertCategory, NotesEvents, OnCallExportCtx, OnCallStatus, OnMessageExportCtx, PHONE_NUMBER_REGEX, PhoneEvents, PhotoEvents, PhotoResp, PreDBContact, PreDBConversation, PreDBMessage, Profile, ReportListingDTO, ResourceConfig, SETTINGS_ALL_TWEETS, SETTING_MENTIONS, ScriptMessage, ServerPromiseResp, SetMessageRead, SettingEvents, SettingOption, Spread, StartCallEventData, Transfer, TransmitterNumDTO, Tweet, TwitterEvents, TwitterProfile, UnformattedMessageConversation, UpdateProfileProps };
