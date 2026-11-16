export interface GalleryPhoto {
  image: string;
  id: number;
}

export enum PhotoResp {
  GENERIC = 'CAMERA.FAILED_TO_TAKE_PHOTO',
  INVALID_IMAGE_HOST = 'GENERIC_INVALID_IMAGE_HOST',
}

export enum PhotoEvents {
  TAKE_PHOTO = 'forge-npwd:TakePhoto',
  CAMERA_EXITED = 'forge-npwd:cameraExited',
  ForgeNPWD_PHOTO_MODE_STARTED = 'forge-npwd:PhotoModeStarted',
  ForgeNPWD_PHOTO_MODE_ENDED = 'forge-npwd:PhotoModeEnded',
  TAKE_PHOTO_SUCCESS = 'forge-npwd:TakePhotoSuccess',
  SAVE_IMAGE = 'forge-npwd:saveImage',
  UPLOAD_PHOTO = 'forge-npwd:UploadPhoto',
  FETCH_PHOTOS = 'forge-npwd:FetchPhotos',
  DELETE_PHOTO = 'forge-npwd:deletePhoto',
  DELETE_MULTIPLE_PHOTOS = 'forge-npwd:deleteMultiplePhotos',
  GET_AUTHORISATION_TOKEN = 'forge-npwd:getAuthToken',
}
