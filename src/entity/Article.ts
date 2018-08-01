import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Node } from './Node';
import { Event } from './Event';

@Entity()
export class Article extends Node {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ array: true, type: 'varchar', nullable: true })
  tags?: string[];

  @Column({ nullable: true })
  featured?: boolean;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ nullable: true })
  url?: string;

  @Column({ nullable: true })
  data?: string;

}
