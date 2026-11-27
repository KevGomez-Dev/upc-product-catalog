import { Check, Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type UserRole = 'admin' | 'manager';

@Entity('users')
@Unique('uq_users_username', ['username'])
@Check(
  'ck_users_username',
  `"username" ~ '[^[:space:]]' AND "username" = lower(btrim("username"))`,
)
@Check('ck_users_role', `"role" IN ('admin', 'manager')`)
export class User {
  @PrimaryGeneratedColumn('identity', { primaryKeyConstraintName: 'pk_users' })
  id!: number;

  @Column('text')
  username!: string;

  @Column('text', { name: 'password_hash', select: false })
  passwordHash!: string;

  @Column('text')
  role!: UserRole;
}
