import { Controller, Query, Authorized } from 'vesper';
import { EventRepository } from '../repository/EventRepository';
import { Paginator } from '../util/Paginator';
import { EventOrder } from '../entity/Event';
import { FIRSTSearch } from '../service/FIRSTSearch';

@Controller()
export class EventController {

  constructor(
    private eventRepository: EventRepository,
    private paginator: Paginator,
    private firstSearch: FIRSTSearch
  ) { }

  @Query()
  @Authorized(['event:read'])
  event({ id }) {
    return this.eventRepository.findById(id);
  }

  @Query()
  @Authorized(['event:read'])
  async eventByCode({ seasonId, code }) {
    const seasonYear = (await this.firstSearch.findSeason(seasonId)).startYear;
    return this.eventRepository.findByCode(seasonYear, code);
  }

  @Query()
  @Authorized(['event:read'])
  eventByYearCode({ year, code }) {
    return this.eventRepository.findByCode(year, code);
  }

  @Query()
  @Authorized(['event:read'])
  async events({ first, after, filter, orderBy, dateRange }) {
    return this.paginator.paginate(
      await this.eventRepository.find(first || 10, after, filter, orderBy, dateRange),
      after
    );
  }

  @Query()
  @Authorized(['event:read'])
  async eventSearch({ query, first, after, filter, orderBy, dateRange }) {
    return this.paginator.paginate(
      await this.eventRepository.query(query, first || 10, after, filter, orderBy, dateRange),
      after
    );
  }

  @Query()
  @Authorized(['event:read'])
  async eventsByLocation({ location, distance, units, first, after, filter, orderBy, dateRange }) {
    return this.paginator.paginate(
      await this.eventRepository.findByLocation(
        location,
        distance,
        units,
        first,
        after,
        filter,
        orderBy,
        dateRange
      ),
      after
    );
  }

}
