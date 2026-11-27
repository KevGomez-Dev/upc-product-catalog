import { Check, Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { ImportSummary } from '../../catalog/import/import.types';

@Entity('import_batches')
@Unique('uq_import_batches_sha256', ['sourceSha256'])
@Check('ck_import_batches_sha256', `"source_sha256" ~ '^[0-9a-f]{64}$'`)
@Check('ck_import_batches_rules_version', '"rules_version" > 0')
export class ImportBatch {
  @PrimaryGeneratedColumn('identity', {
    primaryKeyConstraintName: 'pk_import_batches',
  })
  id!: number;

  @Column('varchar', { name: 'source_sha256', length: 64 })
  sourceSha256!: string;

  @Column('text', { name: 'source_name' })
  sourceName!: string;

  @Column('int', { name: 'rules_version' })
  rulesVersion!: number;

  @Column('timestamp with time zone', {
    name: 'imported_at',
    precision: 0,
    default: () => 'now()',
  })
  importedAt!: Date;

  @Column('jsonb')
  summary!: ImportSummary;
}
