import { Entity, Column, PrimaryColumn, ManyToOne, JoinTable, OneToMany } from 'typeorm';
import { Node } from './Node';

@Entity()
export class Role {

  @PrimaryColumn()
  name: string;

  @Column({ array: true, type: 'varchar' })
  scopes: string[];

}
