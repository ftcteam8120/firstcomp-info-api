import { Controller, Query, Authorized } from 'vesper';
import { EntityManager } from 'typeorm';
import { User } from '../entity/User';
import * as bcrypt from 'bcrypt';
import { JWT } from '../auth/JWT';
import { ScopeTools } from '../auth/ScopeTools';
import { Container } from 'typedi';
import { CurrentUser } from '../auth/CurrentUser';

@Controller()
export class AuthController {

  constructor(
    private entityManager: EntityManager,
    private jwt: JWT,
    private scopeTools: ScopeTools
  ) { }

  @Query()
  login({ username, password }) {
    // Attempt to find the user by email
    return this.entityManager.findOne(User, { email: username }).then((user: User) => {
      if (!user) throw new Error('Invalid username or password');
      // Compare the hashed password with the provided password
      return bcrypt.compare(password, user.password).then(async (valid: boolean) => {
        if (!valid) throw new Error('Invalid username or password');
        // Load the user role
        const userRole = await this.scopeTools.findRole(user.role || 'user');
        // Create the JWT with an expiration in a week
        return this.jwt.createToken(user.id, userRole.scopes, (60 * 60 * 24 * 7));
      });
    });
  }

  @Query()
  authState(args, context) {
    // Get the current user from the context
    const currentUser: CurrentUser = context.container.get(CurrentUser);
    return {
      isLoggedIn: currentUser.id !== undefined,
      user: currentUser.profile
    };
  }

}
