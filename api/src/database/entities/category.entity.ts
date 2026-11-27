import { Check, Entity, PrimaryColumn } from 'typeorm';

@Entity('categories')
@Check('ck_categories_code', `"code" ~ '[^[:space:]]'`)
export class Category {
  @PrimaryColumn('text', { primaryKeyConstraintName: 'pk_categories' })
  code!: string;
}
