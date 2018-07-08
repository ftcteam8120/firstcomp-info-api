import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';

export enum Program {
  JFLL = 'JFLL',
  FLL = 'FLL',
  FTC = 'FTC',
  FRC = 'FRC'
}

@Entity()
export class Team {

  id?: number;

  @PrimaryColumn({ enum: Program })
  program: Program;

  @PrimaryColumn({ type: 'int' })
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
