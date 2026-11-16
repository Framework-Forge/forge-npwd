export enum AudioEvents {
  UPLOAD_AUDIO = 'forge-npwd:audio:uploadAudio',
}

export type AudioRequest = {
  file: any;
  size: number;
};

export type AudioResponse = {
  url: string;
};
