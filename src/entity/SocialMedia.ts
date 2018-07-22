export enum SocialMediaType {
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  PERISCOPE = 'PERISCOPE',
  GITHUB = 'GITHUB'
}

export interface SocialMedia {
  type: SocialMediaType;
  username: string;
}
