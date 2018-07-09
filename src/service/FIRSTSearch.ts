import { Service } from 'typedi';
import { RedisCache } from '../util/RedisCache';
import { Event, EventType } from '../entity/Event';
import { Team, Program } from '../entity/Team';
import { ElasticSearch } from '../util/ElasticSearch';
import { IDGenerator } from '../util/IDGenerator';

@Service()
export class FIRSTSearch {

  constructor(
    private redisCache: RedisCache,
    private elasticSearch: ElasticSearch,
    private idGenerator: IDGenerator
  ) { }
  
  /**
   * Finds a FIRST team
   * @param id The team ID
   */
  public async findTeam(id: string): Promise<Team> {
    // Check for a cached value
    const cached = await this.redisCache.get<Team>(id);
    const teamData = this.idGenerator.decodeTeam(id);
    if (cached) return cached;
    // Otherwise, query the server
    return this.elasticSearch.query('https://es01.usfirst.org/teams/_search', {
      query: {
        query_string: {
          query: `team_number_yearly: ${teamData.number} AND team_type: ${teamData.program}`
        }
      },
      sort: {
        profile_year: {
          order: 'desc' // Order results by profile year descending
        }
      }
    }).then((results: any[]) => {
      if (results.length === 0) {
        return null;
      }
      const teamRaw = results[0];
      const team: Team = {
        id,
        number: teamRaw.team_number_yearly,
        program: teamRaw.team_type,
        nameFull: teamRaw.team_nickname,
        nameShort: teamRaw.team_nickname,
        schoolName: teamRaw.team_name_calc,
        city: teamRaw.team_city,
        stateProv: teamRaw.team_stateprov,
        country: teamRaw.team_country,
        rookieYear: teamRaw.team_rookieyear,
        website: teamRaw.team_web_url
      };
      // Cache the team
      return this.redisCache.set(team).then(() => {
        return team;
      });
    });
  }

  /**
   * Converts a readable event subtype into an EventTypeEnum value
   * @param input The raw event subtype
   */
  public convertEventType(input: string): EventType {
    // Remove all spaces from the event type and capitalize
    let processed = input.replace(' / ', '_').replace(' ', '_').toUpperCase();
    try {
      // Check if the first character is a number
      if (parseInt(processed[0], 2)) {
        // If it is, add a leading underscore
        processed = '_' + processed;
      }
    } catch { }
    for (const type in EventType) {
      // Check against the enum values
      if (EventType[type] === processed) return EventType[type] as EventType;
    }
    // Return null if we cannot determine the event type
    return null;
  }

  /**
   * Finds a FIRST event
   * @param id The event ID
   */
  public async findEvent(id: string): Promise<Event> {
    // Check for a cached value
    const cached = await this.redisCache.get<Event>(id);
    const eventData = this.idGenerator.decodeEvent(id);
    if (cached) return cached;
    // Otherwise, query the server
    return this.elasticSearch.query('https://es01.usfirst.org/events/_search', {
      query: {
        query_string: {
          query: `event_code: ${eventData.code}`
        }
      }
    }).then((results: any[]) => {
      if (results.length === 0) {
        return null;
      }
      const eventRaw = results[0];
      const event: Event = {
        id,
        code: eventRaw.event_code,
        name: eventRaw.event_name,
        description: eventRaw.event_description,
        address: eventRaw.event_address1 +
          (eventRaw.event_address2 ? ' ' + eventRaw.event_address2 : ''),
        venue: eventRaw.event_venue,
        city: eventRaw.event_city,
        country: eventRaw.event_country,
        stateProv: eventRaw.event_stateprov,
        dateStart: eventRaw.date_start,
        dateEnd: eventRaw.date_end,
        type: this.convertEventType(eventRaw.event_subtype),
        website: eventRaw.event_web_url,
        program: eventRaw.event_type
      };
      // Cache the event
      return this.redisCache.set(event).then(() => {
        return event;
      });
    });
  }

}
