import { Controller, Query } from 'vesper';
import { EntityManager } from 'typeorm';
import { EventRepository } from '../repository/EventRepository';
import { Paginator } from '../util/Paginator';

@Controller()
export class EventController {

  constructor(
    private eventRepository: EventRepository,
    private paginator: Paginator
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
    return this.paginator.paginate(
      await this.eventRepository.find(first || 10, after, { program }),
      after
    );
  }

}
