import { Resolver, Resolve, Authorized } from 'vesper';
import { Event } from '../entity/Event';
import { Match } from '../entity/Match';
import { Alliance } from '../entity/Alliance';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { EntityManager } from 'typeorm';
import { Award } from '../entity/Award';
import { Program } from '../entity/Team';
import { TheBlueAlliance } from '../service/TheBlueAlliance';

@Resolver(Event)
export class EventResolver {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private theBlueAlliance: TheBlueAlliance
  ) { }
  
  @Resolve()
  async divisions(event: Event) {
    if (!event.divisions) return [];
    const divisions: Event[] = [];
    for (const id of event.divisions) {
      divisions.push(await this.theBlueAlliance.findEvent(id));
    }
    return divisions;
  }

  @Resolve()
  country(event: Event) {
    return this.firstSearch.findCountry(this.idGenerator.country(event.countryCode));
  }

  @Resolve()
  season(event: Event) {
    return this.firstSearch.findSeasonByYear(event.program, event.season);
  }

  @Resolve()
  @Authorized(['match:read'])
  async matches(event: Event) {
    if (event.program === Program.FRC) {
      return this.theBlueAlliance.findMatches(event);
    }
    return this.entityManager.find(Match, {
      event: event.code,
      eventSeason: event.season
    }).then((matches: Match[]) => {
      if (!matches) return [];
      // Add IDs and the event data to all the matches
      for (const match of matches) {
        match.id = this.idGenerator.match(
          match.number,
          match.setNumber,
          match.level,
          (match.event as Event).id
        );
        match.event = event;
      }
      return matches;
    });
  }

  @Resolve()
  @Authorized(['alliance:read'])
  async alliances(event: Event) {
    if (event.program === Program.FRC) {
      return this.theBlueAlliance.findAlliances(event);
    }
    return this.entityManager.find(Alliance, {
      event: event.code,
      eventSeason: event.season
    }).then(async (alliances: Alliance[]) => {
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
    if (event.program === Program.FRC) {
      return this.theBlueAlliance.findAwards(event);
    }
    return this.entityManager.find(Award, {
      event: event.code,
      eventSeason: event.season
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
