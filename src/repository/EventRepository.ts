import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { Event, EventFilter, EventOrder } from '../entity/Event';
import { FIRSTSearch, FindResult } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { DataMerge } from '../util/DataMerge';

@Service()
export class EventRepository {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private dataMerge: DataMerge
  ) { }

  /**
   * Find an event by ID
   * @param id The event ID
   */
  public async findById(id: string): Promise<Event> {
    return this.dataMerge.mergeOne<Event>(
      await this.firstSearch.findEvent(id),
      await this.entityManager.findOne(Event, {
        code: this.idGenerator.decodeEvent(id).code
      })
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
   * @param first How many events to find
   * @param after A curstor to find events after
   * @param filter An object containing filters
   * @param orderBy An array of EventOrder enums
   */
  public async find(first: number, after?: string, filter?: EventFilter, orderBy?: EventOrder[]):
    Promise<FindResult<Event>> {
    return this.dataMerge.mergeMany<Event>(
      Event,
      await this.firstSearch.findEvents(first, after, filter, orderBy),
      ['code']
    );
  }

}
