export enum MediaType {
  YOUTUBE = 'YOUTUBE',
  IMGUR = 'IMGUR',
  CDPHOTOTHREAD = 'CDPHOTOTHREAD',
  GRABCAD = 'GRABCAD',
  INSTAGRAM_IMAGE = 'INSTAGRAM_IMAGE',
  LINK = 'LINK',
  AVATAR = 'AVATAR'
}

export interface Media {
  type: MediaType;
  key: string;
}
