import { Node } from './Node';
import { Program } from './Team';

export class Season implements Node {
  id: string;
  program: Program;
  name: string;
  startYear: number;
}
