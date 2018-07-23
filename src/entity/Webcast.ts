export enum WebcastType {
  YOUTUBE = 'YOUTUBE',
  TWITCH = 'TWITCH',
  USTREAM = 'USTREAM',
  IFRAME = 'IFRAME',
  HTML5 = 'HTML5',
  RTMP = 'RTMP',
  LIVESTREAM = 'LIVESTREAM'
}

export interface Webcast {
  type: WebcastType;
  data: string;
  file?: string;
}
