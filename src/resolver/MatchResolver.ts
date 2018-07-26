import { Resolver, Resolve, Authorized } from 'vesper';
import { MatchTeam } from '../entity/MatchTeam';
import { Match } from '../entity/Match';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { EntityManager } from 'typeorm';
import { TheBlueAlliance } from '../service/TheBlueAlliance';
import { EventRepository } from '../repository/EventRepository';
import { Event } from '../entity/Event';
import { TheOrangeAlliance } from '../service/TheOrangeAlliance';

@Resolver(Match)
export class MatchResolver {

  constructor(
    private entityManager: EntityManager,
    private eventRepository: EventRepository,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private theBlueAlliance: TheBlueAlliance,
    private theOrangeAlliance: TheOrangeAlliance
  ) {}

  @Resolve()
  @Authorized(['team:read'])
  teams(match: Match) {
    // If the match teams are already filled, return them
    if (match.teams) {
      return match.teams;
    }
    if (match.toaId) {
      return this.theOrangeAlliance.findMatchTeams(match);
    }
    return this.entityManager.find(MatchTeam, {
      matchNumber: match.number,
      matchEvent: match.event
    } as any).then((matchTeams: MatchTeam[]) => {
      if (!matchTeams) return [];
      // Set the match data for all the match teams
      for (const team of matchTeams) {
        team.match = match;
      }
      return matchTeams;
    });
  }

  @Resolve()
  @Authorized(['video:read'])
  videos(match: Match) {
    // Check if the match videos are already set
    if (match.videos === null) return this.theBlueAlliance.findMatchVideos(match);
    return match.videos;
  }

  @Resolve()
  @Authorized(['event:read'])
  event(match: Match) {
    return this.eventRepository.findByCode(
      (match.event as Event).season,
      (match.event as Event).code
    );
  }

}
