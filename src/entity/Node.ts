import { Entity } from 'typeorm';
import { IDGenerator } from '../util/IDGenerator';

@Entity()
export abstract class Node {
  id: string;
}

export function resolveType(data: Node): string {
  return new IDGenerator().getNodeType(data.id);
}
