import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { loadLocalEnvironment } from '../config/environment';
import { databaseOptions } from './database-options';

loadLocalEnvironment();

export default new DataSource(databaseOptions(process.env));
