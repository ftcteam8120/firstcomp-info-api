import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Node } from './Node';
import { Program } from './Team';
import { Article } from './Article';

@Entity()
export class Season implements Node {
  id: string;
  
  @PrimaryColumn()
  program: Program;

  @PrimaryColumn()
  startYear: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @OneToOne(type => Article, { nullable: true })
  @JoinColumn()
  article?: Article | string;

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
