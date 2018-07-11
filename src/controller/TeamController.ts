import { Controller, Query } from 'vesper';
import { TeamRepository } from '../repository/TeamRepository';
import { Paginator } from '../util/Paginator';

@Controller()
export class TeamController {

  constructor(
    private teamRepository: TeamRepository,
    private paginator: Paginator
  ) { }

  @Query()
  team({ id }) {
    return this.teamRepository.findById(id);
  }

  @Query()
  teamByNumber({ program, number }) {
    return this.teamRepository.findByNumber(program, number);
  }

  @Query()
  async teams({ first, after, program, season }) {
    return this.paginator.paginate(
      await this.teamRepository.find(
        first || 10,
        after,
        {
          program,
          season
        }
      ),
      after
    );
  }

}
