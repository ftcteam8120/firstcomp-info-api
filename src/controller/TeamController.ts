import { Controller, Query } from 'vesper';
import { TeamRepository } from '../repository/TeamRepository';
import { IDGenerator } from '../util/IDGenerator';
import { Team } from '../entity/Team';
import { Edge, PageInfo } from '../entity/Node';

@Controller()
export class TeamController {

  constructor(
    private idGenerator: IDGenerator,
    private teamRepository: TeamRepository
  ) { }

  @Query()
  team({ id }) {
    return this.teamRepository.findById(id);
  }

  @Query()
  teamByNumber({ program, number }) {
    return this.teamRepository.findByNumber(program, number);
  }

  @Query()
  async teams({ first, after, program, season }) {
    // Find all teams
    const result = await this.teamRepository.find(
      first || 10,
      after,
      {
        program,
        season
      }
    );
    // Start at 0 if a cursor is not provided
    let from = 0;
    if (after) from = this.idGenerator.decodeCursor(after).from + 1;
    const edges: Edge<Team>[] = [];
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
