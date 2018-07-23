import { Resolver, Resolve, Authorized } from 'vesper';
import { MatchTeam } from '../entity/MatchTeam';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { EntityManager } from 'typeorm';
import { TeamRepository } from '../repository/TeamRepository';
import { Match } from '../entity/Match';
import { Event } from '../entity/Event';

@Resolver(MatchTeam)
export class MatchTeamResolver {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private teamRepository: TeamRepository
  ) {}

  @Resolve()
  @Authorized(['team:read'])
  team(matchTeam: MatchTeam) {
    return this.teamRepository.findByNumber(
      ((matchTeam.match as Match).event as Event).program,
      matchTeam.team as number
    );
  }

}
