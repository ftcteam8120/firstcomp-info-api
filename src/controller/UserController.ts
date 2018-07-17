import { Controller, Query, Authorized } from 'vesper';
import { EntityManager } from 'typeorm';
import { User } from '../entity/User';

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

}
