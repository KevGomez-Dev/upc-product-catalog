import {
  IsString,
  Matches,
  NotContains,
  ValidateBy,
  ValidateIf,
} from 'class-validator';
import {
  ClassificationCode,
  ClassificationDto,
} from '../catalog/classification.dto';
import { isUpc } from '../catalog/upc';

export class ProductWriteDto extends ClassificationDto {
  @ValidateBy({
    name: 'isUpc',
    validator: {
      validate: isUpc,
      defaultMessage: () =>
        'El UPC debe ser texto de exactamente 12 dígitos ASCII.',
    },
  })
  upcCode!: string;

  @IsString({ message: 'La descripción debe ser texto.' })
  @Matches(/\S/, { message: 'La descripción es obligatoria.' })
  @NotContains('\0', {
    message: 'La descripción contiene un carácter no válido.',
  })
  upcDescription!: string;
}

const hasClassificationFilter = ({
  categoryCode,
  subCategoryCode,
}: ProductFilterDto) =>
  categoryCode !== undefined || subCategoryCode !== undefined;

export class ProductFilterDto {
  @ValidateIf(hasClassificationFilter)
  @ClassificationCode()
  categoryCode?: string;

  @ValidateIf(hasClassificationFilter)
  @ClassificationCode()
  subCategoryCode?: string;
}

export class ProductIdDto {
  @ValidateBy({
    name: 'isProductId',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' &&
        /^[0-9]+$/.test(value) &&
        value.trim() === value &&
        Number(value) > 0 &&
        Number(value) <= 2147483647,
      defaultMessage: () =>
        'El ID debe ser un entero positivo dentro del rango admitido.',
    },
  })
  id!: string;
}
