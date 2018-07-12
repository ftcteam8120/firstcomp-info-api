import { Node } from './Node';

export class Country implements Node {
  id: string;
  name: string;
  code: string;
}

export interface CountryFilter {
  code?: string;
}

export enum CountryOrder {
  id_ASC = 'id_ASC',
  id_DESC = 'id_DESC',
  name_ASC = 'name_ASC',
  name_DESC = 'name_DESC',
  code_ASC = 'code_ASC',
  code_DESC = 'code_DESC'
}
