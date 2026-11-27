import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseOptions } from './database/database-options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...databaseOptions(process.env),
        retryAttempts: 1,
      }),
    }),
  ],
})
export class AppModule {}
