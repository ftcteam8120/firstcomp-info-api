import { Controller, Query } from 'vesper';
import { EntityManager } from 'typeorm';
import { EventRepository } from '../repository/EventRepository';

@Controller()
export class EventController {

  constructor(
    private eventRepository: EventRepository
  ) { }

  @Query()
  event({ id }) {
    return this.eventRepository.findById(id);
  }

  @Query()
  eventByCode({ code }) {
    return this.eventRepository.findByCode(code);
  }

}
