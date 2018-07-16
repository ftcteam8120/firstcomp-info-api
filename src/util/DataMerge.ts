import { EntityManager, ObjectType, EntitySchema, Any } from 'typeorm';
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
    firstData: FindResult<T>,
    findFields: string[]
  ): Promise<FindResult<T>> {
    const fields: any = {};
    const nodes: T[] = [];
    const query: any = {};
    // Fill the fields object with search parameters
    for (const data of firstData.data) {
      // Loop through all find fields
      for (const field of findFields) {
        // If the field is not filled, make it an array
        if (!fields[field]) fields[field] = [];
        // Add the query to the fields
        fields[field].push(data[field]);
      }
    }
    for (const data of firstData.data) {
      // Build a query for lodash
      for (const field in fields) {
        query[field] = data[field];
      }
      nodes.push(_.mergeWith(
        {},
        data,
        await this.entityManager.findOne(entityClass, query),
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
