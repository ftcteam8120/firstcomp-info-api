import { Service } from 'typedi';
import { TOA_KEY, TOA_URL, TOA_APP } from '../index';
import { IDGenerator } from '../util/IDGenerator';
import { RedisCache } from '../util/RedisCache';
import fetch from 'node-fetch';
import { Event, EventType } from '../entity/Event';
import * as _ from 'lodash';
import { Match, MatchLevel } from '../entity/Match';
import { Side, MatchTeam } from '../entity/MatchTeam';
import { Alliance } from '../entity/Alliance';
import { Award, AwardType } from '../entity/Award';
import { Ranking } from '../entity/Ranking';
import { Program, Team } from '../entity/Team';
import { FIRSTSearch } from './FIRSTSearch';
import { Webcast, WebcastType } from '../entity/Webcast';

export interface TOAEvent {
  event_key: string;
  season_key: string;
  region_key: string;
  league_key?: string;
  event_code?: string;
  region_number?: number;
  division_key?: number;
  event_type_key: string;
  event_name: string;
  division_name?: string;
  start_date: string;
  end_date: string;
  week_key: string;
  city: string;
  state_prov: string;
  country: string;
  venue: string;
  event_website?: string;
  timezone: string;
  active_tournament_level?: number;
  alliance_count: number;
  fields: number;
  advance_spots?: number;
  advancement_event?: string;
}

export interface TOASeason {
  season_key: string;
  description: string;
}

@Service()
export class TheOrangeAlliance {

  constructor(
    private idGenerator: IDGenerator,
    private redisCache: RedisCache,
    private firstSearch: FIRSTSearch
  ) { }

  private async request(url: string) {
    return fetch(TOA_URL + url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Application-Origin': TOA_APP,
        'X-TOA-Key': TOA_KEY
      }
    }).then(res => res.json());
  }

  private async getAllEvents(): Promise<TOAEvent[]> {
    // Check the cache for TOA events
    const cached = await this.redisCache.get('TOAEvents');
    if (cached) return cached as TOAEvent[];
    // Request a list of all events
    return this.request('events').then((events: TOAEvent[]) => {
      // Cache the events in Redis
      return this.redisCache.setKey('TOAEvents', events).then(() => {
        return events;
      });
    });
  }

  private async getAllSeasons(): Promise<TOASeason[]> {
    // Check the cache for TOA seasons
    const cached = await this.redisCache.get('TOASeasons');
    if (cached) return cached as TOASeason[];
    // Request a list of all seasons
    return this.request('seasons').then((seasons: TOASeason[]) => {
      // Cache the seasons in Redis
      return this.redisCache.setKey('TOASeasons', seasons).then(() => {
        return seasons;
      });
    });
  }

  public async findTOAId(event: Event): Promise<string> {
    if (event.toaId) return Promise.resolve(event.toaId);
    return this.getAllEvents().then((events) => {
      // Attempt to match the event by name, city, state, and season
      // TODO: Replace this with a more robust solution
      const found: TOAEvent = _.find(events, {
        event_name: event.name,
        city: event.city,
        state_prov: event.stateProv,
        season_key: (event.season - 2000).toString() + ((event.season - 2000) + 1).toString()
      });
      if (found) {
        // A matching event was found
        return found.event_key;
      }
    });
  }

  private convertEventType(type: string): EventType {
    switch (type) {
      case 'LGCMP': return EventType.DISTRICT_CHAMPIONSHIP;
      case 'LGMEET': return EventType.MEET;
      case 'OFFSSN': return EventType.OFF_SEASON;
      case 'QUAL': return EventType.QUALIFYING_EVENT;
      case 'RCMP': return EventType.REGIONAL;
      case 'SCRIMMAGE': return EventType.SCRIMMAGE;
      case 'SPRING': return EventType.SPRING_EVENT;
      case 'SPRQUAL': return EventType.SUPER_QUALIFIER;
      case 'SPRRGNL': return EventType.SUPER_REGIONAL;
      case 'WRLDCMP': return EventType.CHAMPIONSHIP;
      default: return EventType.OTHER;
    }
  }

  private convertEvent(id: string, data: TOAEvent): Event {
    const decoded = this.idGenerator.decodeEvent(id);
    if (data) return null;
    return {
      id,
      code: decoded.code,
      type: this.convertEventType(data.event_type_key),
      season: decoded.season,
      name: (data.division_name) ? (data.division_name + ' Division') : data.event_name,
      city: data.city,
      stateProv: data.state_prov,
      countryCode: data.country,
      venue: data.venue,
      timezone: data.timezone,
      week: data.week_key as any * 1,
      website: data.event_website,
      program: Program.FTC,
      toaId: data.event_key
    };
  }

  public async findEvent(id: string): Promise<Event> {
    const decoded = this.idGenerator.decodeEvent(id);
    return this.request(`event/${decoded.code}`).then((rawEvents: any[]) => {
      if (!rawEvents[0]) return null;
      return this.convertEvent(id, rawEvents[0]);
    });
  }

  public async injectToaData(event: Event): Promise<Event> {
    // Attempt to match the event with one in the TOA database
    const found: TOAEvent = _.find(await this.getAllEvents(), {
      event_name: event.name,
      city: event.city,
      state_prov: event.stateProv,
      season_key: (event.season - 2000).toString() + ((event.season - 2000) + 1).toString()
    });
    // Merge the found event with the data we already have
    return Promise.resolve(
      _.mergeWith(
        {},
        this.convertEvent(event.id, found),
        event,
        (a, b) => b === null ? a : undefined
      )
    );
  }

  // TODO: Replace this with something less dependent on the match name
  private splitMatchName(name: string): { number: number; setNumber: number; } {
    const split: string[] = name.split(' ');
    const number = split[1] as any * 1;
    let setNumber = 1;
    if (split[3]) {
      setNumber = split[3] as any * 1;
    }
    return {
      number,
      setNumber
    };
  }

  private convertMatchLevel(level: number): MatchLevel {
    switch (level) {
      case 1: return MatchLevel.QM;
      case 4: return MatchLevel.F;
      default: return MatchLevel.SF;
    }
  }

  private convertMatch(id: string, event: Event, data: any): Match {
    return {
      id,
      event,
      // Adds the number and setNumber properties
      ...this.splitMatchName(data.match_name),
      level : this.convertMatchLevel(data.tournament_level),
      scoreBlueTeleop: data.blue_tele_score,
      scoreBlueAuto: data.blue_auto_score,
      scoreBlueEnd: data.blue_end_score,
      scoreBlueFoul: data.blue_penalty,
      scoreBlueTotal: data.blue_score,
      scoreRedTeleop: data.red_tele_score,
      scoreRedAuto: data.red_auto_score,
      scoreRedEnd: data.red_end_score,
      scoreRedFoul: data.red_penalty,
      scoreRedTotal: data.red_score,
      winner: (data.red_score > data.blue_score) ? Side.RED : Side.BLUE,
      teams: null,
      toaId: data.match_key
    };
  }

  public async findMatches(event: Event): Promise<Match[]> {
    const toaId = await this.findTOAId(event);
    if (!toaId) return [];
    return this.request(
      'event/' +
      toaId +
      '/matches'
    ).then((rawMatches: any[]) => {
      const matches: Match[] = [];
      for (const match of rawMatches) {
        matches.push(
          this.convertMatch(
            this.idGenerator.toaMatch(
              match.match_key,
              event.id
            ),
            event,
            match
          )
        );
      }
      return matches;
    });
  }

  private convertTeam(id: string, event: Event, data: any): Team {
    return {
      id,
      number: data.team_number,
      program: Program.FTC,
      name: data.team_name_short,
      sponsors: data.team_name_long,
      city: data.city,
      stateProv: data.state_prov,
      countryCode: data.country,
      rookieYear: data.rookie_year,
      website: data.website,
      season: event.season
    };
  }

  public async findTeams(event: Event): Promise<Team[]> {
    const toaId = await this.findTOAId(event);
    if (!toaId) return [];
    return this.request(`event/${toaId}/teams`).then((rawTeams: any[]) => {
      const teams: Team[] = [];
      for (const team of rawTeams) {
        teams.push(this.convertTeam(
          this.idGenerator.team(event.program, team.team_number),
          event,
          team
        ));
      }
      return teams;
    }).catch(() => {
      return [];
    });
  }

  private convertMatchTeam(data: any, match: Match): MatchTeam {
    return {
      match,
      team: data.team_key * 1,
      side: (data.station / 10 < 2) ? Side.RED : Side.BLUE,
      dq: false,
      surrogate: (data.station_status === 0)
    };
  }

  public async findMatchTeams(match: Match): Promise<MatchTeam[]> {
    return this.request(
      'match/' +
      match.toaId +
      '/stations'
    ).then((rawMatchTeams: any[]) => {
      const matchTeams: MatchTeam[] = [];
      for (const matchTeam of rawMatchTeams) {
        matchTeams.push(this.convertMatchTeam(matchTeam, match));
      }
      return matchTeams;
    });
  }

  public async findDivisions(event: Event): Promise<Event[]> {
    // Get the TOA ID
    const toaId = await this.findTOAId(event);
    if (!toaId) return [];
    const divisions: Event[] = [];
    const events = await this.getAllEvents();
    // Find all events with the name name (probably divisions)
    const found = _.filter(events, { event_name: event.name });
    let division: Event;
    for (const obj of found) {
      // Make sure we don't return the base event
      if (obj.event_key !== toaId) {
        // Copy the base event
        division = Object.assign({}, event);
        // Set the division name
        division.name = obj.division_name + ' Division';
        // Set the division type
        if (event.type === EventType.DISTRICT_CHAMPIONSHIP) {
          division.type = EventType.DISTRICT_CHAMPIONSHIP_DIVISION;
        } else {
          division.type = EventType.CHAMPIONSHIP_DIVISION;
        }
        // Set the division ID
        division.id = this.idGenerator.event(division.season, obj.event_key);
        // Set the division code
        division.code = obj.event_key;
        // Set the new TOA ID
        division.toaId = obj.event_key;
        // Push the division to the array
        divisions.push(division);
      }
    }
    return divisions;
  }

  private convertAlliances(event: Event, rawAlliances: any[]): Alliance[] {
    const alliances: Alliance[] = [];
    const numbers: number[] = [];
    for (const alliance of rawAlliances) {
      if (!numbers.includes(alliance.alliance_number)) {
        numbers.push(alliance.alliance_number);
      }
    }
    for (const number of numbers) {
      const data: any[] = _.filter(rawAlliances, { alliance_number: number } as any);
      const alliance: Alliance = {
        event,
        number,
        name: null,
        captain: null,
        picks: [],
        backup: null,
        backupReplaced: null
      };
      for (const a of data) {
        if (a.alliance_pick === 0) {
          alliance.captain = a.team_key * 1;
        } else {
          (alliance.picks as number[]).push(a.team_key * 1);
        }
      }
      alliances.push(alliance);
    }
    return alliances;
  }

  public async findAlliances(event: Event): Promise<Alliance[]> {
    const toaId = await this.findTOAId(event);
    if (!toaId) return [];
    return this.request(
      'event/' +
      toaId +
      '/alliances'
    ).then((rawAlliances: any[]) => {
      return this.convertAlliances(event, rawAlliances);
    });
  }

  private convertAwardType(type: string): AwardType {
    switch (type) {
      case 'INS': return AwardType.INSPIRE;
      case 'WIN': return AwardType.WINNER;
      case 'FIN': return AwardType.FINALIST;
      case 'THK': return AwardType.THINK;
      case 'CNT': return AwardType.CONNECT;
      case 'INV': return AwardType.INNOVATE;
      case 'DSN': return AwardType.DESIGN;
      case 'MOT': return AwardType.MODIVATE;
      case 'CTL': return AwardType.CONTROL;
      case 'PRM': return AwardType.PROMOTE;
      case 'CMP': return AwardType.COMPASS;
      case 'DNS': return AwardType.DEANS_LIST;
      case 'JUD': return AwardType.JUDGES;
      default: return AwardType.OTHER;
    }
  }

  private convertAwards(event: Event, rawAwards: any[], year?: number): Award[] {
    const awards: Award[] = [];
    const foundAwards: string[] = [];
    for (const award of rawAwards) {
      const newAward: Award = {
        event,
        year,
        type: this.convertAwardType((award.awards_key as string).split('-')[3].substr(0, 3)),
        recipients: [],
        name: award.award_name
      };
      const key: string = award.award_key.substr(0, 3);
      if (!foundAwards.includes(key)) {
        for (const a of rawAwards) {
          const k2: string = a.award_key.substr(0, 3);
          if (k2 === key) {
            newAward.recipients.push({
              award: newAward,
              team: (!a.receiver_name) ? a.team_key * 1 : null,
              person: a.receiver_name
            });
          }
        }
        foundAwards.push(key);
        awards.push(newAward);
      }
    }
    return awards;
  }

  public async findAwards(event: Event): Promise<Award[]> {
    const toaId = await this.findTOAId(event);
    if (!toaId) return [];
    return this.request(
      'event/' +
      toaId +
      '/awards'
    ).then((rawAwards: any[]) => {
      return this.convertAwards(event, rawAwards);
    });
  }

  private convertRanking(event: Event, data: any): Ranking {
    return {
      event,
      rank: data.rank,
      dq: data.disqualified,
      matchesPlayed: data.played,
      rankingPoints: data.ranking_points,
      qualifyingPoints: data.qualifying_points,
      losses: data.losses,
      wins: data.wins,
      ties: data.ties,
      team: data.team_key * 1
    };
  }

  public async findRankings(event: Event): Promise<Ranking[]> {
    const toaId = await this.findTOAId(event);
    if (!toaId) return [];
    return this.request(
      'event/' +
      toaId +
      '/rankings'
    ).then((rawRankings: any[]) => {
      const rankings: Ranking[] = [];
      for (const ranking of rawRankings) {
        rankings.push(this.convertRanking(event, ranking));
      }
      // Order the rankings into the correct order
      return _.orderBy(rankings, ['rank'], ['asc']) as Ranking[];
    });
  }

  public async findMatch(id: string): Promise<Match> {
    const decoded = this.idGenerator.decodeToaMatch(id);
    return this.request(
      'match/' + decoded.key
    ).then((rawMatches: any[]) => {
      if (!rawMatches[0]) return null;
      return this.convertMatch(
        id,
        { code: decoded.eventCode, season: decoded.eventSeason, program: Program.FTC } as any,
        rawMatches[0]
      );
    });
  }

  public async findTeamAwards(team: Team): Promise<Award[]> {
    const seasons = await this.getAllSeasons();
    const awards: Award[] = [];
    // Loop through all possible seasons
    for (const season of seasons) {
      // Calculate the year based on the season key
      const year: number = (season.season_key.substr(0, 2) as any * 1) + 2000;
      // Only get awards after the team's rookie year to prevent unnecessary requests
      if (year >= team.rookieYear) {
        // Request team awards for that year
        await this.request(
          'team/' + team.number.toString() + '/' + season.season_key + '/awards'
        ).then((rawAwards: any[]) => {
          if (rawAwards.length > 0) {
            // Convert all of the awards
            awards.push(
              ...this.convertAwards(
                { program: Program.FTC } as any,
                rawAwards,
                year
              )
            );
          }
        });
      }
    }
    return Promise.resolve(awards);
  }

  public async findTeamEvents(team: Team): Promise<Event[]> {
    const seasons = await this.getAllSeasons();
    const events: Event[] = [];
    for (const season of seasons) {
      // Calculate the year based on the season key
      const year: number = (season.season_key.substr(0, 2) as any * 1) + 2000;
      // Only get events after the team's rookie year to prevent unnecessary requests
      if (year >= team.rookieYear) {
        // Request team events for that year
        await this.request(
          'team/' + team.number.toString() + '/' + season.season_key + '/events'
        ).then(async (rawEvents: any[]) => {
          if (rawEvents.length > 0) {
            // Match all the events to the official FIRST database
            for (const event of rawEvents) {
              events.push(await this.firstSearch.matchToaEvent(event));
            }
          }
        });
      }
    }
    return Promise.resolve(events);
  }

  // We still need to verify TOA webcast types
  private convertWebcastType(type: string): WebcastType {
    switch (type) {
      case 'twitch': return WebcastType.TWITCH;
      case 'youtube': return WebcastType.YOUTUBE;
    }
  }

  // This function may or may not work depending on how TOA API is next season
  private convertWebcast(data: any): Webcast {
    return {
      type: this.convertWebcastType(data.stream_type),
      data: data.stream_link
    };
  }

  public async findEventWebcasts(event: Event): Promise<Webcast[]> {
    const toaId = await this.findTOAId(event);
    if (!toaId) return [];
    return this.request(
      'event/' +
      toaId +
      '/stream'
    ).then((rawStreams: any[]) => {
      const webcasts: Webcast[] = [];
      for (const webcast of rawStreams) {
        webcasts.push(this.convertWebcast(webcast));
      }
      return webcasts;
    });
  }

}
