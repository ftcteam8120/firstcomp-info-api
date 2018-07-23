import { Resolver, Resolve } from 'vesper';
import { Ranking } from '../entity/Ranking';
import { TeamRepository } from '../repository/TeamRepository';
import { Event } from '../entity/Event';

@Resolver(Ranking)
export class RankingResolver {

  constructor(
    private teamRepository: TeamRepository
  ) {}

  @Resolve()
  team(ranking: Ranking) {
    return this.teamRepository.findByNumber(
      (ranking.event as Event).program,
      ranking.team as number
    );
  }

}
