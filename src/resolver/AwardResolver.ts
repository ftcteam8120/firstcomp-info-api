import { Resolver, Resolve, Authorized } from 'vesper';
import { Award } from '../entity/Award';
import { Event } from '../entity/Event';
import { EntityManager } from 'typeorm';
import { AwardRecipient } from '../entity/AwardRecipient';

@Resolver(Award)
export class AwardResolver {

  constructor(
    private entityManager: EntityManager
  ) { }

  @Resolve()
  @Authorized(['award_recipient:read'])
  recipients(award: Award) {
    if (award.recipients) return award.recipients;
    return this.entityManager.find(AwardRecipient, {
      award: award.type,
      awardEvent: (award.event as Event).code,
      awardEventSeason: (award.event as Event).season,
    }).then((recipients: AwardRecipient[]) => {
      // Add award data to all recipients
      for (const recipient of recipients) {
        recipient.award = award;
      }
      return recipients;
    });
  }

}
