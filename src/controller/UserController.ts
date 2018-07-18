import { Controller, Query, Authorized, Mutation, ArgsValidator } from 'vesper';
import { EntityManager, InsertResult } from 'typeorm';
import { User } from '../entity/User';
import { CreateUserArgsValidator } from '../validator/CreateUserArgsValidator';
import { CreateUserArgs } from '../args/CreateUserArgs';
import * as bcrypt from 'bcrypt';

@Controller()
export class UserController {

  constructor(
    private entityManager: EntityManager
  ) { }

  @Query()
  @Authorized(['user:read'])
  users() {
    return this.entityManager.find(User);
  }

  @Query()
  @Authorized(['user:read'])
  user({ id }) {
    return this.entityManager.findOne(User, id);
  }

  @Mutation()
  @ArgsValidator(CreateUserArgsValidator)
  createUser(args: CreateUserArgs) {
    // Hash the new user password
    return bcrypt.hash(args.user.password, 10).then((hashed: string) => {
      // Insert the user into the database
      return this.entityManager.insert(User,
        this.entityManager.create(User, {
          ...args.user,
          password: hashed
        })
      ).then((value: InsertResult) => {
        // Verify the insert and return the new user
        return this.entityManager.findOne(User, {
          id: value.identifiers[0].id
        });
      }).catch(() => {
        throw new Error('Error creating user');
      });
    });
  }

}
