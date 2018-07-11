import { Service } from 'typedi';
import { FindResult } from '../service/FIRSTSearch';
import { Node, PageInfo, Edge, Connection } from '../entity/Node';
import { IDGenerator } from './IDGenerator';

@Service()
export class Paginator {

  constructor(
    private idGenerator: IDGenerator
  ) { }

  public paginate(result: FindResult<Node>, after: string): Connection<Node> {
    // Start at 0 if a cursor is not provided
    let from = 0;
    if (after) from = this.idGenerator.decodeCursor(after).from + 1;
    const edges: Edge<any>[] = [];
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
