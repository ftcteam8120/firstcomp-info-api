import { Resolver, Resolve } from 'vesper';
import { MatchTeam } from '../entity/MatchTeam';
import { Match } from '../entity/Match';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { EntityManager } from 'typeorm';
import { TheBlueAlliance } from '../service/TheBlueAlliance';
import { EventRepository } from '../repository/EventRepository';
import { Event } from '../entity/Event';

@Resolver(Match)
export class MatchResolver {

  constructor(
    private entityManager: EntityManager,
    private eventRepository: EventRepository,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private theBlueAllaince: TheBlueAlliance
  ) {}

  @Resolve()
  teams(match: Match) {
    // If the match teams are already filled, return them
    if (match.teams) {
      return match.teams;
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
  videos(match: Match) {
    // Check if the match videos are already set
    if (match.videos === null) return this.theBlueAllaince.findMatchVideos(match);
    return match.videos;
  }

  @Resolve()
  event(match: Match) {
    return this.eventRepository.findByCode(
      (match.event as Event).season,
      (match.event as Event).code
    );
  }

}
