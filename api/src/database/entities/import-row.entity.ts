import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type {
  Diagnostic,
  ImportStatus,
  Normalization,
} from '../../catalog/import/import.types';
import { ImportBatch } from './import-batch.entity';

@Entity('import_rows')
@Unique('uq_import_rows_batch_line', ['batchId', 'lineStart'])
@Check(
  'ck_import_rows_lines',
  '"line_start" >= 2 AND "line_end" >= "line_start"',
)
@Check(
  'ck_import_rows_status',
  `"status" IN ('imported', 'duplicate', 'pending')`,
)
@Check(
  'ck_import_rows_duplicate',
  `("status" = 'duplicate') = ("duplicate_of_line" IS NOT NULL) AND ("duplicate_of_line" IS NULL OR "duplicate_of_line" < "line_start")`,
)
export class ImportRow {
  @PrimaryGeneratedColumn('identity', {
    primaryKeyConstraintName: 'pk_import_rows',
  })
  id!: number;

  @Column('int', { name: 'batch_id' })
  batchId!: number;

  @ManyToOne(() => ImportBatch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'batch_id',
    foreignKeyConstraintName: 'fk_import_rows_batch',
  })
  batch!: ImportBatch;

  @Column('int', { name: 'line_start' })
  lineStart!: number;

  @Column('int', { name: 'line_end' })
  lineEnd!: number;

  @Column('text', { name: 'original_id', nullable: true })
  originalId!: string | null;

  @Column('text', { name: 'raw_record' })
  rawRecord!: string;

  @Column('jsonb', { name: 'source_fields' })
  sourceFields!: string[];

  @Column('text')
  status!: ImportStatus;

  @Column('jsonb')
  diagnostics!: Diagnostic[];

  @Column('jsonb')
  normalizations!: Normalization[];

  @Column('int', { name: 'duplicate_of_line', nullable: true })
  duplicateOfLine!: number | null;

  @ManyToOne(() => ImportRow, { onDelete: 'RESTRICT' })
  @JoinColumn([
    {
      name: 'batch_id',
      referencedColumnName: 'batchId',
      foreignKeyConstraintName: 'fk_import_rows_duplicate',
    },
    { name: 'duplicate_of_line', referencedColumnName: 'lineStart' },
  ])
  duplicateOf!: ImportRow | null;
}
