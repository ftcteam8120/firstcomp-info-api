import { Controller, Query } from 'vesper';
import { EntityManager } from 'typeorm';
import { Team } from '../entity/Team';

@Controller()
export class TeamController {

  constructor(private entityManager : EntityManager) {}

  @Query()
  teams() {
    return this.entityManager.find(Team);
  }

  @Query()
  team({ program, number }) {
    return this.entityManager.findOne(Team, { program, number });
  }

}
