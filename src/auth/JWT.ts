import { Service } from 'typedi';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '..';
import { CurrentUser } from './CurrentUser';
import { getManager } from 'typeorm';
import { User } from '../entity/User';
import { Auth } from './Auth';

@Service()
export class JWT {

  public createToken(user: User, scopes: string[], expiresIn: number): Auth {
    const exp = Math.floor(Date.now() / 1000) + expiresIn;
    const token = jwt.sign({
      scopes,
      exp,
      sub: user.id
    }, JWT_SECRET);
    return {
      user,
      token,
      scopes,
      expires: exp
    };
  }
  
  public async decodeToken(token: string): Promise<CurrentUser> {
    let data: any;
    try {
      data = jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
    const entityManager = getManager();
    const user = await entityManager.findOneOrFail(User, { id: data.sub });
    return new CurrentUser(user, data.scopes, data.exp);
  }

}
