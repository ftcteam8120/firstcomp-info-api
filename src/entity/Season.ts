import { Node } from './Node';
import { Program } from './Team';

export class Season implements Node {
  id: string;
  program: Program;
  name: string;
  startYear: number;
}

export interface SeasonFilter {
  program?: Program;
  startYear?: number;
}

export enum SeasonOrder {
  id_ASC = 'id_ASC',
  id_DESC = 'id_DESC',
  program_ASC = 'program_ASC',
  program_DESC = 'program_DESC',
  name_ASC = 'name_ASC',
  name_DESC = 'name_DESC',
  startYear_ASC = 'startYear_ASC',
  startYear_DESC = 'startYear_DESC'
}
