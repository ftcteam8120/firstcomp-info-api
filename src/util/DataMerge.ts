import { EntityManager, ObjectType, EntitySchema } from 'typeorm';
import { Service } from 'typedi';
import * as _ from 'lodash';
import { FindResult } from '../service/FIRSTSearch';
import { Node } from '../entity/Node';

@Service()
export class DataMerge {

  constructor(
    private entityManager: EntityManager
  ) { }

  public mergeOne<T extends Node>(firstData: T, localData: T): T {
    if (firstData === null && localData === undefined) return null;
    return _.mergeWith(
      {},
      firstData,
      localData,
      (a, b) => b === null ? a : undefined
    );
  }

  public async mergeMany<T extends Node>(
    entityClass: ObjectType<any> | EntitySchema<any> | string,
    firstData: FindResult<T>
  ): Promise<FindResult<T>> {
    const ids: string[] = [];
    const nodes: T[] = [];
    // Fill the array of IDs to search for
    for (let i = 0; i < firstData.data.length; i += 1) {
      ids.push(firstData.data[i].id);
    }
    // Find all those IDs locally
    const localData = await this.entityManager.findByIds(entityClass, ids);
    for (let i = 0; i < firstData.data.length; i += 1) {
      // Push the merged data into the nodes array
      nodes.push(_.mergeWith(
        {},
        firstData.data[i],
        _.find(localData, ['id', firstData.data[i].id]),
        (a, b) => b === null ? a : undefined
      ));
    }
    return {
      totalCount: firstData.totalCount,
      hasNextPage: firstData.hasNextPage,
      hasPreviousPage: firstData.hasPreviousPage,
      data: nodes
    };
  }

}
