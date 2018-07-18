import { Entity, Column, PrimaryColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Match } from './Match';
import { Team, Program } from './Team';
import { Node } from './Node';

export enum Station {
  Blue1 = 'Blue1',
  Blue2 = 'Blue2',
  Blue3 = 'Blue3',
  Red1 = 'Red1',
  Red2 = 'Red2',
  Red3 = 'Red3'
}

@Entity()
export class MatchTeam {

  @PrimaryColumn({ type: 'varchar', name: 'matchEvent' })
  @ManyToOne(type => Match, match => match.teams)
  match: Match | string;

  @PrimaryColumn({ type: 'int', name: 'matchEventSeason' })
  matchEventSeason: number;

  @PrimaryColumn({ type: 'int', name: 'matchNumber' })
  matchNumber: number;

  @PrimaryColumn({ type: 'int', name: 'teamNumber' })
  team: Team | number;

  @Column({ enum: Station })
  station: Station;

  @Column({ nullable: true })
  dq: boolean;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @Column({ nullable: true })
  surrogate: boolean;

}
