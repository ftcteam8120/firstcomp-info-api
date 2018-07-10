import { Controller, Query } from 'vesper';
import { EntityManager } from 'typeorm';
import { EventRepository } from '../repository/EventRepository';
import { IDGenerator } from '../util/IDGenerator';
import { Event } from '../entity/Event';
import { Edge, PageInfo } from '../entity/Node';

@Controller()
export class EventController {

  constructor(
    private eventRepository: EventRepository,
    private idGenerator: IDGenerator
  ) { }

  @Query()
  event({ id }) {
    return this.eventRepository.findById(id);
  }

  @Query()
  eventByCode({ code }) {
    return this.eventRepository.findByCode(code);
  }

  @Query()
  async events({ first, after, program }) {
    // Find all events
    const result = await this.eventRepository.find(first || 10, after, { program });
    // Start at 0 if a cursor is not provided
    let from = 0;
    if (after) from = this.idGenerator.decodeCursor(after).from + 1;
    const edges: Edge<Event>[] = [];
    // Process the data into edges
    for (let i = 0; i < result.data.length; i += 1) {
      edges.push({
        node: result.data[i],
        // Generate a cursor based on the current id and position
        cursor: this.idGenerator.makeCursor(result.data[i].id, from + i)
      });
    }
    // Generate the PageInfo for the response
    const pageInfo: PageInfo = {
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      startCursor: edges[0] ? edges[0].cursor : null,
      endCursor: edges[0] ? edges[edges.length - 1].cursor : null
    };
    return {
      pageInfo,
      edges,
      totalCount: result.totalCount
    };
  }

}
