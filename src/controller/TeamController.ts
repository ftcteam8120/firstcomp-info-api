import { Controller, Query } from 'vesper';
import { Team } from '../entity/Team';
import { TeamRepository } from '../repository/TeamRepository';

@Controller()
export class TeamController {

  constructor(
    private teamRepository: TeamRepository
  ) { }

  @Query()
  team({ program, number }) {
    return this.teamRepository.findByNumber(program, number);
  }

}
