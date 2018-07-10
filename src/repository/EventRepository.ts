import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { Event } from '../entity/Event';
import { FIRSTSearch, FindResult, EventQueryParams } from '../service/FIRSTSearch';
import * as _ from 'lodash';
import { IDGenerator } from '../util/IDGenerator';

@Service()
export class EventRepository {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator
  ) { }

  /**
   * Find an event by ID
   * @param id The event ID
   */
  public async findById(id: string): Promise<Event> {
    const firstData = await this.firstSearch.findEvent(id);
    const eventData = this.idGenerator.decodeEvent(id);
    const localData = await this.entityManager.findOne(Event, { code: eventData.code });
    if (firstData === null && localData === undefined) return null;
    return _.mergeWith(
      {},
      firstData,
      localData,
      (a, b) => b === null ? a : undefined
    );
  }
  
  /**
   * Find an event by code
   * @param code The event code
   */
  public async findByCode(code: string): Promise<Event> {
    return this.findById(this.idGenerator.event(code));
  }

  /**
   * Find all events
   * @param first How many events to find (defaults to 10)
   * @param after An event cursor
   */
  public async find(first: number, after?: string, query?: EventQueryParams):
    Promise<FindResult<Event>> {
    // Get the FIRST data
    const firstData = await this.firstSearch.findEvents(first, after, query);
    const ids: string[] = [];
    const events: Event[] = [];
    // Fill the array of IDs to search for
    for (let i = 0; i < firstData.data.length; i += 1) {
      ids.push(firstData.data[i].id);
    }
    // Find all those IDs locally
    const localData = await this.entityManager.findByIds(Event, ids);
    for (let i = 0; i < firstData.data.length; i += 1) {
      // Push the merged data into the events array
      events.push(_.mergeWith(
        {},
        firstData.data[i],
        _.find(localData, { id: firstData.data[i].id }),
        (a, b) => b === null ? a : undefined
      ));
    }
    return {
      totalCount: firstData.totalCount,
      hasNextPage: firstData.hasNextPage,
      hasPreviousPage: firstData.hasPreviousPage,
      data: events
    };
  }

}
