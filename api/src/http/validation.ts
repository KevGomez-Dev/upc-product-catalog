import { ValidationPipe, type ValidationError } from '@nestjs/common';
import { ApiException } from './api-errors';

function collectFieldErrors(
  errors: ValidationError[],
  fields: Record<string, string[]>,
  parent = '',
): void {
  for (const error of errors) {
    if (
      error.constraints?.whitelistValidation ||
      error.constraints?.unknownValue
    ) {
      fields._request = [
        'La solicitud contiene propiedades no permitidas o tiene un formato inválido.',
      ];
      continue;
    }

    const path = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) {
      fields[path] = Object.values(error.constraints);
    }
    if (error.children?.length) {
      collectFieldErrors(error.children, fields, path);
    }
  }
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    validationError: { target: false, value: false },
    exceptionFactory: (errors: ValidationError[]) => {
      const fieldErrors: Record<string, string[]> = Object.create(
        null,
      ) as Record<string, string[]>;
      collectFieldErrors(errors, fieldErrors);
      return new ApiException(400, {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los datos de la solicitud.',
        fieldErrors,
      });
    },
  });
}
