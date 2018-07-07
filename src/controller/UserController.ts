import { Controller, Query } from 'vesper';
import { EntityManager } from 'typeorm';
import { User } from '../entity/User';

@Controller()
export class UserController {

  constructor(private entityManager : EntityManager) {}

  @Query()
  users() {
    return this.entityManager.find(User);
  }

  @Query()
  user({ id }) {
    return this.entityManager.findOne(User, id);
  }

}
