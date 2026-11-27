import { Injectable } from '@nestjs/common';
import { Client } from 'pg';
import { readDatabaseUrl } from '../config/environment';

const timeoutMs = 1500;

@Injectable()
export class HealthService {
  private inFlight?: Promise<boolean>;

  checkDatabase(): Promise<boolean> {
    this.inFlight ??= this.probe().finally(() => {
      this.inFlight = undefined;
    });
    return this.inFlight;
  }

  private async probe(): Promise<boolean> {
    const client = new Client({
      connectionString: readDatabaseUrl(process.env),
      connectionTimeoutMillis: timeoutMs,
      query_timeout: timeoutMs,
    });
    // A socket error between connection and query belongs to this disposable probe.
    client.on('error', () => {});
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
    });
    const query = (async () => {
      try {
        await client.connect();
        await client.query('SELECT 1');
        return true;
      } catch {
        return false;
      }
    })();
    try {
      return await Promise.race([query, deadline]);
    } finally {
      clearTimeout(timer);
      void client.end().catch(() => {});
    }
  }
}
