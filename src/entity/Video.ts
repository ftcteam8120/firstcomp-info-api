export enum VideoType {
  YOUTUBE = 'YOUTUBE',
  TBA = 'TBA'
}

export interface Video {
  type: VideoType;
  key: string;
}
