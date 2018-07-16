import { Resolver, Resolve } from 'vesper';
import { Award } from '../entity/Award';
import { Event } from '../entity/Event';
import { TeamRepository } from '../repository/TeamRepository';

@Resolver(Award)
export class AwardResolver {

  constructor(
    private teamRepository: TeamRepository
  ) { }

  @Resolve()
  team(award: Award) {
    if (!award.team) return null;
    return this.teamRepository.findByNumber(
      (award.event as Event).program,
      award.team as number
    );
  }

}
