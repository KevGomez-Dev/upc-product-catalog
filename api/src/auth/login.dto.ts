import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'El usuario debe ser texto.' })
  @Length(1, 254, {
    message: 'El usuario debe tener entre 1 y 254 caracteres.',
  })
  @Matches(/\S/, { message: 'El usuario es obligatorio.' })
  username!: string;

  @IsString({ message: 'La contraseña debe ser texto.' })
  @Length(1, 256, {
    message: 'La contraseña debe tener entre 1 y 256 caracteres.',
  })
  password!: string;
}
