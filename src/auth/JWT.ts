import { Service } from 'typedi';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '..';
import { CurrentUser } from './CurrentUser';
import { getManager } from 'typeorm';
import { User } from '../entity/User';
import { Auth } from './Auth';

@Service()
export class JWT {

  public createToken(userId: string, scopes: string[], expiresIn: number): Auth {
    const exp = Math.floor(Date.now() / 1000) + expiresIn;
    const token = jwt.sign({
      scopes,
      exp,
      sub: userId
    }, JWT_SECRET);
    return {
      token,
      scopes,
      expires: exp
    };
  }
  
  public async decodeToken(token: string): Promise<CurrentUser> {
    const data: any = jwt.verify(token, JWT_SECRET);
    const entityManager = getManager();
    const user = await entityManager.findOneOrFail(User, { id: data.sub });
    return new CurrentUser(user, data.scopes);
  }

}
