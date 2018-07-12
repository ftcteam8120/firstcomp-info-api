import { Controller, Query } from 'vesper';
import { EventRepository } from '../repository/EventRepository';
import { Paginator } from '../util/Paginator';
import { EventOrder } from '../entity/Event';

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
  async events({ first, after, filter, orderBy }) {
    return this.paginator.paginate(
      await this.eventRepository.find(first || 10, after, filter, orderBy),
      after
    );
  }

}
