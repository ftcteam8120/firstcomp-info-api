import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { Node } from './Node';

export enum Program {
  JFLL = 'JFLL',
  FLL = 'FLL',
  FTC = 'FTC',
  FRC = 'FRC'
}

@Entity()
export class Team implements Node {

  @PrimaryColumn()
  id: string;

  @Column()
  program: Program;

  @Column()
  number: string;

  @Column({ nullable: true })
  homeCmp?: string;

  @Column({ nullable: true })
  nameFull?: string;

  @Column({ nullable: true })
  nameShort?: string;

  @Column({ nullable: true })
  schoolName?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  stateProv?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  rookieYear?: number;

  @Column({ nullable: true })
  robotName?: string;

  @Column({ nullable: true })
  districtCode?: string;

  @Column({ nullable: true })
  website?: string;

}
