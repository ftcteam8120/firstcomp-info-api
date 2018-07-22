import { Entity, Column, PrimaryColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Match, MatchLevel } from './Match';
import { Team, Program } from './Team';
import { Node } from './Node';

export enum Side {
  BLUE = 'BLUE',
  RED = 'RED'
}

@Entity()
export class MatchTeam {

  @PrimaryColumn({ type: 'varchar', name: 'matchEvent' })
  @ManyToOne(type => Match, match => match.teams)
  match?: Match | string;

  @PrimaryColumn({ type: 'int', name: 'matchEventSeason' })
  matchEventSeason?: number;

  @PrimaryColumn({ type: 'int', name: 'matchNumber' })
  matchNumber?: number;

  @PrimaryColumn({ type: 'int', name: 'matchSetNumber' })
  matchSetNumber?: number;

  @PrimaryColumn({ enum: MatchLevel, name: 'matchLevel' })
  matchLevel?: MatchLevel;

  @PrimaryColumn({ type: 'int', name: 'teamNumber' })
  team: Team | number;

  @Column({ enum: Side })
  side: Side;

  @Column({ nullable: true })
  dq: boolean;

  @Column({ type: 'jsonb', nullable: true })
  details?: any;

  @Column({ nullable: true })
  surrogate: boolean;

}
