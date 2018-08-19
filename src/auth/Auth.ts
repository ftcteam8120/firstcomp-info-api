import { User } from '../entity/User';

export interface Auth {
  token: string;
  scopes: string[];
  expires: number;
  user: User;
}
