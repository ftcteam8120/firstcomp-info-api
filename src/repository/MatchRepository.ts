import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { IDGenerator } from '../util/IDGenerator';
import { TheBlueAlliance } from '../service/TheBlueAlliance';
import { Match, MatchFilter, MatchOrder } from '../entity/Match';
import { Event } from '../entity/Event';
import { FindResult } from '../service/FIRSTSearch';
import * as _ from 'lodash';
import { Program } from '../entity/Team';
import { TheOrangeAlliance } from '../service/TheOrangeAlliance';

@Service()
export class MatchRepository {

  constructor(
    private entityManager: EntityManager,
    private idGenerator: IDGenerator,
    private theBlueAlliance: TheBlueAlliance,
    private theOrangeAlliance: TheOrangeAlliance
  ) { }

  /**
   * Find a match by ID
   * @param id The match ID
   */
  public async findById(id: string): Promise<Match> {
    // Check if the match if from TOA
    if (this.idGenerator.isToaMatch(id)) {
      return this.theOrangeAlliance.findMatch(id);
    }
    return this.theBlueAlliance.findMatch(id);
  }

  /**
   * Find matches for an event
   * @param event The event to find matches for
   * @param first How many matches to find
   * @param after A cursor to find matches after
   * @param filter An object containing filters
   * @param orderBy An array of MatchOrder enums
   */
  public async find(
    event: Event,
    first: number,
    after?: string,
    filter?: MatchFilter,
    orderBy?: MatchOrder[]
  ): Promise<FindResult<Match>> {
    let matches: Match[] = [];
    // Decode the cursor
    let from = 0;
    if (after) from = this.idGenerator.decodeCursor(after).from + 1;
    if (event.program === Program.FRC) {
      matches = await this.theBlueAlliance.findMatches(event);
      // Slice the array if less are requested
      if (first) {
        if (first < matches.length) matches = matches.slice(from, first + from);
      } else {
        // Slice the front of the array
        matches = matches.slice(from, matches.length);
      }
    } else if (event.program === Program.FTC) {
      matches = await this.theOrangeAlliance.findMatches(event);
      // Slice the array if less are requested
      if (first) {
        if (first < matches.length) matches = matches.slice(from, first + from);
      } else {
        // Slice the front of the array
        matches = matches.slice(from, matches.length);
      }
    } else {
      matches = await this.entityManager.find(Match, {
        take: first || 100,
        skip: from,
        where: {
          event: event.code,
          eventSeason: event.season
        }
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
    let limit = matches.length;
    if (first < limit - from) {
      limit = first;
    }
    if (filter) {
      // Filter the objects first
      matches = _.filter(matches, filter as any);
    }
    if (orderBy) {
      // Get the orders from the orderBy arg
      const orderFields: string[] = [];
      const orders: string[] = [];
      let split: string[];
      for (const order of orderBy) {
        split = (order as string).split('_');
        orderFields.push(split[0]);
        orders.push(split[1].toLowerCase());
      }
      // Order last
      matches = _.orderBy(matches, orderFields, orders);
    }
    return {
      totalCount: matches.length,
      hasNextPage: first < limit - from,
      hasPreviousPage: from > 0,
      data: matches
    };
  }

}
