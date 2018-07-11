import { Entity } from 'typeorm';
import { IDGenerator } from '../util/IDGenerator';

@Entity()
export abstract class Node {
  id: string;
  internalId?: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface Connection<T> {
  pageInfo: PageInfo;
  edges: Edge<T>[];
  totalCount: number;
}

export function resolveType(data: Node): string {
  return new IDGenerator().getNodeType(data.id);
}
