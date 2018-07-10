import { Entity, Column, PrimaryColumn, OneToMany, ManyToMany, JoinTable, Index } from 'typeorm';
import { Program } from './Team';
import { Match } from './Match';
import { User } from './User';
import { Node } from './Node';

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

  @PrimaryColumn()
  id: string;

  internalId?: string;

  @Index()
  @Column()
  code: string;

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
  country?: string;

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

}
