import { Entity, Column, PrimaryColumn, ManyToOne, JoinTable, OneToMany } from 'typeorm';
import { Event } from './Event';
import { MatchTeam, Side } from './MatchTeam';
import { Node } from './Node';
import { Video } from './Video';

export enum MatchLevel {
  EF = 'EF',
  QM = 'QM',
  QF = 'QF',
  SF = 'SF',
  F = 'F'
}

@Entity()
export class Match implements Node {

  id: string;

  @PrimaryColumn({ type: 'int' })
  number: number;

  @PrimaryColumn({ type: 'int' })
  setNumber: number;

  @PrimaryColumn({ enum: MatchLevel })
  level: MatchLevel;

  @PrimaryColumn({ type: 'varchar', name: 'eventCode' })
  @ManyToOne(type => Event, event => event.matches)
  event?: Event | string;

  @PrimaryColumn({ type: 'int', name: 'eventSeason' })
  eventSeason?: number;

  @Column({ type: 'time', nullable: true })
  actualStartTime?: Date;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'time', nullable: true })
  postResultTime?: Date;

  @Column({ type: 'int', nullable: true })
  scoreRedTeleop?: number;

  @Column({ type: 'int', nullable: true })
  scoreRedFoul?: number;

  @Column({ type: 'int', nullable: true })
  scoreRedAuto?: number;

  @Column({ type: 'int', nullable: true })
  scoreRedAutoBonus?: number;

  @Column({ type: 'int', nullable: true })
  scoreRedTotal?: number;

  @Column({ type: 'int', nullable: true })
  scoreRedEnd?: number;

  @Column({ type: 'int', nullable: true })
  scoreBlueTeleop?: number;

  @Column({ type: 'int', nullable: true })
  scoreBlueFoul?: number;

  @Column({ type: 'int', nullable: true })
  scoreBlueAuto?: number;

  @Column({ type: 'int', nullable: true })
  scoreBlueAutoBonus?: number;

  @Column({ type: 'int', nullable: true })
  scoreBlueEnd?: number;

  @Column({ type: 'int', nullable: true })
  scoreBlueTotal?: number;

  @Column({ type: 'jsonb', nullable: true })
  details?: any;

  @Column({ enum: Side, nullable: true })
  winner?: Side;

  @OneToMany(type => MatchTeam, matchTeam => matchTeam.match)
  teams: MatchTeam[];

  videos?: Video[];

}
