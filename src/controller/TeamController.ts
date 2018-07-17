import { Controller, Query, Authorized } from 'vesper';
import { TeamRepository } from '../repository/TeamRepository';
import { Paginator } from '../util/Paginator';
import { TeamOrder } from '../entity/Team';

@Controller()
export class TeamController {

  constructor(
    private teamRepository: TeamRepository,
    private paginator: Paginator
  ) { }

  @Query()
  @Authorized(['team:read'])
  team({ id }) {
    return this.teamRepository.findById(id);
  }

  @Query()
  @Authorized(['team:read'])
  teamByNumber({ program, number }) {
    return this.teamRepository.findByNumber(program, number);
  }

  @Query()
  @Authorized(['team:read'])
  async teams({ first, after, filter, orderBy }) {
    return this.paginator.paginate(
      await this.teamRepository.find(first || 10, after, filter, orderBy),
      after
    );
  }

}
