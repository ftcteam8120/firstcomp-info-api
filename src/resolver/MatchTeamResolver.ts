import { Resolver, Resolve } from 'vesper';
import { MatchTeam } from '../entity/MatchTeam';
import { Team } from '../entity/Team';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { EntityManager } from 'typeorm';
import { TeamRepository } from '../repository/TeamRepository';

@Resolver(MatchTeam)
export class MatchTeamResolver {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private teamRepository: TeamRepository
  ) {}

  @Resolve()
  team(matchTeam: MatchTeam) {
    return this.teamRepository.findByNumber(matchTeam.teamProgram, matchTeam.team as number);
  }

}
