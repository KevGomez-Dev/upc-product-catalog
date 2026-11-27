import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadLocalEnvironment, readApiEnvironment } from './config/environment';

async function bootstrap(): Promise<void> {
  loadLocalEnvironment();
  const { port } = readApiEnvironment(process.env);
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  app.enableShutdownHooks();
  await app.listen(port, '127.0.0.1');
}

void bootstrap().catch((error: unknown) => {
  Logger.error(
    error instanceof Error ? error.message : 'Error inesperado.',
    'Bootstrap',
  );
  process.exitCode = 1;
});
