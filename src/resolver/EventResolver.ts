import { Resolver, Resolve, Authorized } from 'vesper';
import { Event } from '../entity/Event';
import { Match } from '../entity/Match';
import { Alliance } from '../entity/Alliance';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { EntityManager } from 'typeorm';
import { Award } from '../entity/Award';

@Resolver(Event)
export class EventResolver {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator
  ) {}

  @Resolve()
  country(event: Event) {
    return this.firstSearch.findCountry(this.idGenerator.country(event.countryCode));
  }

  @Resolve()
  season(event: Event) {
    return this.firstSearch.findSeason(event.seasonId);
  }

  @Resolve()
  @Authorized(['match:read'])
  matches(event: Event) {
    return this.entityManager.find(Match, {
      event: event.code
    }).then((matches: Match[]) => {
      if (!matches) return [];
      // Add IDs and the event data to all the matches
      for (const match of matches) {
        match.id = this.idGenerator.match(
          match.number,
          (match.event as Event).id
        );
        match.event = event;
      }
      return matches;
    });
  }

  @Resolve()
  @Authorized(['alliance:read'])
  alliances(event: Event) {
    return this.entityManager.find(Alliance, {
      event: event.code
    }).then((alliances: Alliance[]) => {
      if (!alliances) return [];
      // Add event data to all the alliances
      for (const alliance of alliances) {
        alliance.event = event;
      }
      return alliances;
    });
  }

  @Resolve()
  @Authorized(['award:read'])
  awards(event: Event) {
    return this.entityManager.find(Award, {
      event: event.code
    }).then((awards: Award[]) => {
      if (!awards) return [];
      // Add event data to all the awards
      for (const award of awards) {
        award.event = event;
      }
      return awards;
    });
  }

}
