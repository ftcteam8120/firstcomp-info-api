import { Resolver, Resolve, Authorized } from 'vesper';
import { Award } from '../entity/Award';
import { Event } from '../entity/Event';
import { AwardRecipient } from '../entity/AwardRecipient';
import { TeamRepository } from '../repository/TeamRepository';

@Resolver(AwardRecipient)
export class AwardRecipientResolver {

  constructor(
    private teamRepository: TeamRepository
  ) { }

  @Resolve()
  @Authorized(['team:read'])
  team(awardRecipient: AwardRecipient) {
    if (!awardRecipient.team) return null;
    return this.teamRepository.findByNumber(
      ((awardRecipient.award as Award).event as Event).program,
      awardRecipient.team as number
    );
  }

}
