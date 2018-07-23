import { Entity, PrimaryColumn, ManyToOne, Column } from 'typeorm';
import { Event } from './Event';
import { Team } from './Team';

@Entity()
export class Ranking {

  @PrimaryColumn({ type: 'varchar', name: 'eventCode' })
  @ManyToOne(type => Event, event => event.matches)
  event?: Event | string;

  @PrimaryColumn({ type: 'int', name: 'eventSeason' })
  eventSeason?: number;

  @PrimaryColumn({ type: 'int' })
  rank: number;

  @Column({ type: 'int' })
  dq: number;

  @Column({ type: 'int' })
  matchesPlayed: number;

  @Column({ type: 'int', nullable: true })
  rankingPoints?: number;

  @Column({ type: 'int', nullable: true })
  qualifyingPoints?: number;

  @Column({ type: 'int' })
  losses: number;

  @Column({ type: 'int' })
  wins: number;

  @Column({ type: 'int' })
  ties: number;

  @Column({ type: 'int' })
  team: Team | number;

}
