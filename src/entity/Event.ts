import { Entity, Column, PrimaryColumn, OneToMany, ManyToMany, JoinTable, Index } from 'typeorm';
import { Program } from './Team';
import { Match } from './Match';
import { User } from './User';
import { Node } from './Node';
import { Alliance } from './Alliance';
import { Award } from './Award';

export enum EventType {
  KICKOFF = 'KICKOFF',
  WORKSHOP = 'WORKSHOP',
  SCRIMMAGE = 'SCRIMMAGE',
  INTERVIEW_ONLY = 'INTERVIEW_ONLY',
  MEET = 'MEET',
  QUALIFYING_EVENT = 'QUALIFYING_EVENT',
  _2ND_TIER_QUALIFYING_EVENT = '_2ND_TIER_QUALIFYING_EVENT',
  SUPER_REGIONAL = 'SUPER_REGIONAL',
  REGIONAL = 'REGIONAL',
  DISTRICT_EVENT = 'DISTRICT_EVENT',
  DISTRICT_CHAMPIONSHIP = 'DISTRICT_CHAMPIONSHIP',
  DISTRICT_CHAMPIONSHIP_WITH_LEVELS = 'DISTRICT_CHAMPIONSHIP_WITH_LEVELS',
  DISTRICT_CHAMPIONSHIP_DIVISION = 'DISTRICT_CHAMPIONSHIP_DIVISION',
  CHAMPIONSHIP_SUBDIVISION = 'CHAMPIONSHIP_SUBDIVISION',
  CHAMPIONSHIP_DIVISION = 'CHAMPIONSHIP_DIVISION',
  CHAMPIONSHIP = 'CHAMPIONSHIP',
  WORLD_FESTIVAL = 'WORLD_FESTIVAL',
  OFF_SEASON = 'OFF_SEASON',
  OFF_SEASON_WITH_AZURE_SYNC = 'OFF_SEASON_WITH_AZURE_SYNC',
  OFFICIAL_EXPO = 'OFFICIAL_EXPO',
  TRAINING_EDUCATION = 'TRAINING_EDUCATION',
  DISPLAY_DEMONSTRATION = 'DISPLAY_DEMONSTRATION'
}

@Entity()
export class Event implements Node {

  id: string;

  internalId?: string;

  @PrimaryColumn({ type: 'varchar' })
  code: string;

  @PrimaryColumn({ type: 'int' })
  season: number;

  @ManyToMany(type => User)
  @JoinTable()
  admins?: User[];

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  venue?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  countryCode?: string;

  @Column({ nullable: true })
  stateProv?: string;

  @Column({ type: 'date', nullable: true })
  dateStart?: string;

  @Column({ type: 'date', nullable: true })
  dateEnd?: string;

  @Column({ enum: EventType, nullable: true })
  type?: EventType;

  @Column({ nullable: true })
  website?: string;

  @Column({ enum: Program, nullable: true })
  program?: Program;

  @OneToMany(type => Match, match => match.event)
  matches?: Match[];

  @OneToMany(type => Alliance, alliance => alliance.event)
  alliances?: Alliance[];

  @OneToMany(type => Award, award => award.event)
  awards?: Award[];

  seasonId?: string;

}

export interface EventFilter {
  program?: Program;
}

export enum EventOrder {
  id_ASC = 'id_ASC',
  id_DESC = 'id_DESC',
  code_ASC = 'code_ASC',
  code_DESC = 'code_DESC',
  address_ASC = 'address_ASC',
  address_DESC = 'address_DESC',
  name_ASC = 'name_ASC',
  name_DESC = 'name_DESC',
  description_ASC = 'description_ASC',
  description_DESC = 'description_DESC',
  venue_ASC = 'venue_ASC',
  venue_DESC = 'venue_DESC',
  city_ASC = 'city_ASC',
  city_DESC = 'city_DESC',
  country_ASC = 'country_ASC',
  country_DESC = 'country_DESC',
  stateProv_ASC = 'stateProv_ASC',
  stateProv_DESC = 'stateProv_DESC',
  dateStart_ASC = 'dateStart_ASC',
  dateStart_DESC = 'dateStart_DESC',
  dateEnd_ASC = 'dateEnd_ASC',
  dateEnd_DESC = 'dateEnd_DESC',
  type_ASC = 'type_ASC',
  type_DESC = 'type_DESC',
  website_ASC = 'website_ASC',
  website_DESC = 'website_DESC',
  program_ASC = 'program_ASC',
  program_DESC = 'program_DESC',
}
