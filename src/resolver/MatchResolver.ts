import { Resolver, Resolve } from 'vesper';
import { MatchTeam } from '../entity/MatchTeam';
import { Match } from '../entity/Match';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { EntityManager } from 'typeorm';

@Resolver(Match)
export class MatchResolver {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator
  ) {}

  @Resolve()
  teams(match: Match) {
    return this.entityManager.find(MatchTeam, {
      matchNumber: match.number,
      matchEvent: match.event
    } as any).then((matchTeams: MatchTeam[]) => {
      if (!matchTeams) return [];
      return matchTeams;
    });
  }

}
