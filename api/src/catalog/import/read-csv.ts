import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import type { SourceRow } from './import.types';

const headerFields = [
  'Id',
  'UpcDescription',
  'UpcCode',
  'CategoryCode',
  'SubCategoryCode',
  'DateAdded',
  'UpdatedDate',
  'AddedBy',
  'ModifiedBy',
];

export const fieldCount = headerFields.length;

export function readCatalogCsv(contents: Buffer): {
  sha256: string;
  rows: SourceRow[];
} {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(contents);
  if (text.includes('\0')) {
    throw new Error(
      'El CSV contiene un carácter NUL que PostgreSQL no puede preservar.',
    );
  }

  // With info enabled, csv-parse wraps each array with its byte-offset metadata.
  const parsed: unknown = parse(contents, {
    bom: true,
    info: true,
    record_delimiter: ['\r\n', '\n', '\r'],
    relax_column_count: true,
  });
  const [header, ...entries] = parsed as {
    record: string[];
    info: { bytes: number };
  }[];

  if (
    header?.record.length !== fieldCount ||
    headerFields.some((field, index) => header.record[index] !== field)
  ) {
    throw new Error('El encabezado del CSV no coincide con el catálogo.');
  }

  let byteStart = header.info.bytes;
  let lineStart = 2;
  const rows = entries.map(({ record, info }) => {
    const rawRecord = contents
      .toString('utf8', byteStart, info.bytes)
      .replace(/(?:\r\n|\n|\r)$/, '');
    const lineEnd = lineStart + (rawRecord.match(/\r\n|\n|\r/g)?.length ?? 0);
    const row = { lineStart, lineEnd, rawRecord, sourceFields: record };
    byteStart = info.bytes;
    lineStart = lineEnd + 1;
    return row;
  });

  return { sha256: createHash('sha256').update(contents).digest('hex'), rows };
}
