import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ImportRow } from './import-row.entity';
import { Subcategory } from './subcategory.entity';

@Entity('products')
@Unique('uq_products_upc_code', ['upcCode'])
@Unique('uq_products_import_row_id', ['importRowId'])
@Index('ix_products_subcategory_id', ['subcategoryId'])
@Check('ck_products_upc_code', `"upc_code" ~ '^[0-9]{12}$'`)
@Check('ck_products_description', `"upc_description" ~ '[^[:space:]]'`)
@Check('ck_products_dates', '"date_added" <= "updated_date"')
@Check(
  'ck_products_actors',
  `"added_by" ~ '[^[:space:]]' AND "modified_by" ~ '[^[:space:]]'`,
)
export class Product {
  @PrimaryGeneratedColumn('identity', {
    primaryKeyConstraintName: 'pk_products',
  })
  id!: number;

  @Column('varchar', { name: 'upc_code', length: 12 })
  upcCode!: string;

  @Column('text', { name: 'upc_description' })
  upcDescription!: string;

  @Column('int', { name: 'subcategory_id' })
  subcategoryId!: number;

  @ManyToOne(() => Subcategory, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'subcategory_id',
    foreignKeyConstraintName: 'fk_products_subcategory',
  })
  subcategory!: Subcategory;

  @Column('timestamp with time zone', { name: 'date_added', precision: 0 })
  dateAdded!: Date;

  @Column('timestamp with time zone', { name: 'updated_date', precision: 0 })
  updatedDate!: Date;

  @Column('text', { name: 'added_by' })
  addedBy!: string;

  @Column('text', { name: 'modified_by' })
  modifiedBy!: string;

  @Column('int', { name: 'import_row_id', nullable: true })
  importRowId!: number | null;

  @ManyToOne(() => ImportRow, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'import_row_id',
    foreignKeyConstraintName: 'fk_products_import_row',
  })
  importRow!: ImportRow | null;
}
