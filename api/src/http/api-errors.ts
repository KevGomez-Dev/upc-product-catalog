import { randomUUID } from 'node:crypto';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

interface ErrorDetails {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export class ApiException extends HttpException {
  constructor(
    status: number,
    readonly details: ErrorDetails,
  ) {
    super(details, status);
  }
}

const publicErrors: Record<number, ErrorDetails> = {
  400: { code: 'BAD_REQUEST', message: 'La solicitud no es válida.' },
  401: { code: 'UNAUTHORIZED', message: 'Se requiere una sesión válida.' },
  403: { code: 'FORBIDDEN', message: 'No tienes permiso para esta operación.' },
  404: { code: 'NOT_FOUND', message: 'El recurso no existe.' },
  409: {
    code: 'CONFLICT',
    message: 'La operación entra en conflicto con los datos existentes.',
  },
  413: {
    code: 'PAYLOAD_TOO_LARGE',
    message: 'El cuerpo de la solicitud supera el límite.',
  },
  415: {
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'El formato de la solicitud no está admitido.',
  },
  429: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Demasiados intentos. Intenta de nuevo más tarde.',
  },
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const requestId = randomUUID();
    let details: ErrorDetails;

    if (statusCode >= 500) {
      this.logger.error(
        `Solicitud fallida (${statusCode}), requestId=${requestId}`,
      );
      details = {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error inesperado.',
      };
    } else {
      details =
        exception instanceof ApiException
          ? exception.details
          : (publicErrors[statusCode] ?? {
              code: 'REQUEST_ERROR',
              message: 'No se pudo procesar la solicitud.',
            });
    }

    const response: unknown = host.switchToHttp().getResponse();
    const adapter = this.adapterHost.httpAdapter;
    adapter.setHeader(response, 'Cache-Control', 'no-store');
    if (details.code === 'UNAUTHORIZED') {
      adapter.setHeader(response, 'WWW-Authenticate', 'Bearer');
    }
    adapter.reply(response, { statusCode, ...details, requestId }, statusCode);
  }
}
