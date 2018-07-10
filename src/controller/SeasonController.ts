import { Controller, Query } from 'vesper';
import { Edge, PageInfo } from '../entity/Node';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { Season } from '../entity/Season';
import { IDGenerator } from '../util/IDGenerator';

@Controller()
export class SeasonController {

  constructor(
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator
  ) { }

  @Query()
  async seasons({ first, after, program }) {
    // Find all seasons
    const result = await this.firstSearch.findSeasons(first || 100, after, { program });
    // Start at 0 if a cursor is not provided
    let from = 0;
    if (after) from = this.idGenerator.decodeCursor(after).from + 1;
    const edges: Edge<Season>[] = [];
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

  @Query()
  season({ id }) {
    return this.firstSearch.findSeason(id);
  }

  @Query()
  seasonByYear({ program, year }) {
    return this.firstSearch.findSeasonByYear(program, year);
  }

}
