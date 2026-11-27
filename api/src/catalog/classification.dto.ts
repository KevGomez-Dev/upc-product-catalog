import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, NotContains } from 'class-validator';

export function ClassificationCode(): PropertyDecorator {
  return applyDecorators(
    IsString({ message: 'El código debe ser texto.' }),
    Matches(/\S/, { message: 'El código es obligatorio.' }),
    NotContains('\0', { message: 'El código contiene un carácter no válido.' }),
  );
}

export class CategoryParamsDto {
  @ClassificationCode()
  categoryCode!: string;
}

export class ClassificationDto extends CategoryParamsDto {
  @ClassificationCode()
  subCategoryCode!: string;
}
