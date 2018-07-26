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
import { MatchRepository } from '../repository/MatchRepository';
import { Ranking } from '../entity/Ranking';
import { Paginator } from '../util/Paginator';
import * as _ from 'lodash';
import { EventRepository } from '../repository/EventRepository';
import { TheOrangeAlliance } from '../service/TheOrangeAlliance';

@Resolver(Event)
export class EventResolver {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private theBlueAlliance: TheBlueAlliance,
    private theOrangeAlliance: TheOrangeAlliance,
    private paginator: Paginator,
    private matchRepository: MatchRepository,
    private eventRepository: EventRepository
  ) { }
  
  @Resolve()
  @Authorized(['event:read'])
  async divisions(event: Event, { first, after, filter, orderBy }) {
    // Pass the data into the paginator
    return this.paginator.paginate(
      await this.eventRepository.findDivisions(
        event,
        first,
        after,
        filter,
        orderBy
      ),
      after
    );
  }

  @Resolve()
  @Authorized(['country:read'])
  country(event: Event) {
    return this.firstSearch.findCountry(this.idGenerator.country(event.countryCode));
  }

  @Resolve()
  @Authorized(['season:read'])
  season(event: Event) {
    return this.firstSearch.findSeasonByYear(event.program, event.season);
  }

  @Resolve()
  @Authorized(['match:read'])
  async matches(event: Event, { first, after, filter, orderBy }) {
    return this.paginator.paginate(
      await this.matchRepository.find(
        event,
        first,
        after,
        filter,
        orderBy
      ),
      after
    );
  }

  @Resolve()
  @Authorized(['alliance:read'])
  async alliances(event: Event) {
    if (event.program === Program.FRC) {
      return this.theBlueAlliance.findAlliances(event);
    }
    if (event.program === Program.FTC) {
      return this.theOrangeAlliance.findAlliances(event);
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
    if (event.program === Program.FTC) {
      return this.theOrangeAlliance.findAwards(event);
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

  @Resolve()
  @Authorized(['ranking:read'])
  rankings(event: Event) {
    if (event.program === Program.FRC) {
      return this.theBlueAlliance.findRankings(event);
    }
    if (event.program === Program.FTC) {
      return this.theOrangeAlliance.findRankings(event);
    }
    return this.entityManager.find(Ranking, {
      event: event.code,
      eventSeason: event.season
    }).then((rankings: Ranking[]) => {
      if (!rankings) return [];
      // Add event data to all the awards
      for (const ranking of rankings) {
        ranking.event = event;
      }
      return rankings;
    });
  }

  @Resolve()
  @Authorized(['webcast:read'])
  webcasts(event: Event) {
    if (event.webcasts) return event.webcasts;
    if (event.program === Program.FTC) return this.theOrangeAlliance.findEventWebcasts(event);
    return [];
  }

}
