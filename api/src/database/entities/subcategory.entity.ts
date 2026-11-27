import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('subcategories')
@Unique('uq_subcategories_category_code', ['categoryCode', 'code'])
@Check('ck_subcategories_code', `"code" ~ '[^[:space:]]'`)
export class Subcategory {
  @PrimaryGeneratedColumn('identity', {
    primaryKeyConstraintName: 'pk_subcategories',
  })
  id!: number;

  @Column('text')
  code!: string;

  @Column('text', { name: 'category_code' })
  categoryCode!: string;

  @ManyToOne(() => Category, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'category_code',
    foreignKeyConstraintName: 'fk_subcategories_category',
  })
  category!: Category;
}
