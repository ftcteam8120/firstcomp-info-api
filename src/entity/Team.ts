import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { Node } from './Node';

export enum Program {
  JFLL = 'JFLL',
  FLL = 'FLL',
  FTC = 'FTC',
  FRC = 'FRC',
  FP = 'FP',
  FIRST = 'FIRST',
  FPTS = 'FPTS'
}

@Entity()
export class Team implements Node {

  id: string;

  internalId?: string;

  @PrimaryColumn({ enum: Program })
  program: Program;

  @PrimaryColumn({ type: 'int' })
  number: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  sponsors?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  stateProv?: string;

  @Column({ nullable: true })
  countryCode?: string;

  @Column({ nullable: true })
  rookieYear?: number;

  @Column({ nullable: true })
  districtCode?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  profileYear?: number;

  seasonId?: string;

}

export interface TeamFilter {
  program?: Program;
  season?: string;
  profileYear?: number;
}

export enum TeamOrder {
  id_ASC = 'id_ASC',
  id_DESC = 'id_DESC',
  program_ASC = 'program_ASC',
  program_DESC = 'program_DESC',
  number_ASC = 'number_ASC',
  number_DESC = 'number_DESC',
  name_ASC  = 'name_ASC',
  name_DESC  = 'name_DESC',
  city_ASC = 'city_ASC',
  city_DESC = 'city_DESC',
  stateProv_ASC = 'stateProv_ASC',
  stateProv_DESC = 'stateProv_DESC',
  countryCode_ASC = 'countryCode_ASC',
  countryCode_DESC = 'countryCode_DESC',
  rookieYear_ASC = 'rookieYear_ASC',
  rookieYear_DESC = 'rookieYear_DESC',
  website_ASC = 'website_ASC',
  website_DESC = 'website_DESC',
  profileYear_ASC = 'profileYear_ASC',
  profileYear_DESC = 'profileYear_DESC'
}
