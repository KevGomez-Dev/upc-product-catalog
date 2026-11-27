import {
  collectClassifications,
  observedClassifications,
  resolveClassification,
} from './classification';
import type {
  CatalogReview,
  ImportSummary,
  ReviewedRow,
  SourceRow,
} from './import.types';
import { hasValidUpcCheckDigit, isUpc } from '../upc';
import { fieldCount, readCatalogCsv } from './read-csv';

function parseUtcSeconds(value: string): Date | undefined {
  if (
    value.length !== 20 ||
    !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/.test(value) ||
    value.startsWith('0000')
  ) {
    return undefined;
  }
  const date = new Date(value);
  if (
    Number.isNaN(date.valueOf()) ||
    date.toISOString() !== value.replace('Z', '.000Z')
  ) {
    return undefined;
  }
  return date;
}

function reviewRow(source: SourceRow, observed: Set<string>): ReviewedRow {
  const row: ReviewedRow = {
    ...source,
    originalId: source.sourceFields[0] || null,
    diagnostics: [],
    normalizations: [],
  };
  const reject = (code: string, field?: string) => {
    row.diagnostics.push({ code, field, severity: 'error' });
  };

  if (source.sourceFields.length !== fieldCount) {
    reject('COLUMN_COUNT');
    return row;
  }

  const [
    id,
    upcDescription,
    rawUpc,
    categoryCode,
    subcategoryCode,
    added,
    modified,
    addedBy,
    modifiedBy,
  ] = source.sourceFields;
  if (!/^[+-]?[0-9]+$/.test(id) || id.trim() !== id)
    reject('INVALID_ORIGINAL_ID', 'Id');
  if (!upcDescription.trim()) reject('REQUIRED', 'UpcDescription');

  const upcCode = rawUpc.trim();
  if (upcCode !== rawUpc) {
    row.normalizations.push({
      field: 'UpcCode',
      before: rawUpc,
      after: upcCode,
    });
  }
  if (!isUpc(upcCode)) {
    reject('INVALID_UPC', 'UpcCode');
  } else if (!hasValidUpcCheckDigit(upcCode)) {
    row.diagnostics.push({
      code: 'UPC_CHECKSUM',
      field: 'UpcCode',
      severity: 'warning',
    });
  }

  const classification = resolveClassification(
    categoryCode,
    subcategoryCode,
    observed,
    row.normalizations,
  );
  if (!categoryCode.trim()) reject('REQUIRED', 'CategoryCode');
  if (!subcategoryCode.trim()) reject('REQUIRED', 'SubCategoryCode');
  if (categoryCode.trim() && subcategoryCode.trim() && !classification) {
    reject('CLASSIFICATION_MISMATCH', 'SubCategoryCode');
  }

  const dateAdded = parseUtcSeconds(added);
  const updatedDate = parseUtcSeconds(modified);
  if (!dateAdded) reject('INVALID_DATE', 'DateAdded');
  if (!updatedDate) reject('INVALID_DATE', 'UpdatedDate');
  if (dateAdded && updatedDate && dateAdded > updatedDate)
    reject('DATE_ORDER', 'UpdatedDate');
  if (!addedBy.trim()) reject('REQUIRED', 'AddedBy');
  if (!modifiedBy.trim()) reject('REQUIRED', 'ModifiedBy');

  if (
    classification &&
    dateAdded &&
    updatedDate &&
    !row.diagnostics.some(({ severity }) => severity === 'error')
  ) {
    row.product = {
      ...classification,
      upcCode,
      upcDescription,
      dateAdded,
      updatedDate,
      addedBy,
      modifiedBy,
    };
  }
  return row;
}

export function reviewCatalog(contents: Buffer): CatalogReview {
  const source = readCatalogCsv(contents);
  const observed = observedClassifications(source.rows);
  const rows = source.rows.map((row) => reviewRow(row, observed));
  const canonicalLines = new Map<string, number>();
  const upcGroups = new Map<string, ReviewedRow[]>();

  for (const row of rows) {
    if (row.sourceFields.length !== fieldCount) continue;
    const originalFields = JSON.stringify(row.sourceFields);
    const canonicalLine = canonicalLines.get(originalFields);
    if (canonicalLine !== undefined) {
      row.duplicateOfLine = canonicalLine;
      row.product = undefined;
      row.diagnostics.push({
        code: 'EXACT_DUPLICATE',
        severity: 'info',
        relatedLines: [canonicalLine],
      });
      continue;
    }

    canonicalLines.set(originalFields, row.lineStart);
    const upc = row.sourceFields[2].trim();
    if (!isUpc(upc)) continue;
    const group = upcGroups.get(upc) ?? [];
    group.push(row);
    upcGroups.set(upc, group);
  }

  for (const group of upcGroups.values()) {
    if (group.length < 2) continue;
    for (const row of group) {
      row.product = undefined;
      row.diagnostics.push({
        code: 'SOURCE_UPC_CONFLICT',
        field: 'UpcCode',
        severity: 'error',
        relatedLines: group
          .filter((other) => other !== row)
          .map((other) => other.lineStart),
      });
    }
  }
  return { sha256: source.sha256, rows };
}

export function inspectCatalog(review: CatalogReview): ImportSummary {
  const products = review.rows.flatMap(({ product }) =>
    product ? [product] : [],
  );
  const taxonomy = collectClassifications(products);
  const duplicates = review.rows.filter(
    ({ duplicateOfLine }) => duplicateOfLine !== undefined,
  ).length;
  return {
    rows: review.rows.length,
    products: products.length,
    duplicates,
    pending: review.rows.length - products.length - duplicates,
    categories: taxonomy.categories.length,
    subcategories: taxonomy.subcategories.length,
    users: 0,
    warnings: review.rows
      .flatMap(({ diagnostics }) => diagnostics)
      .filter(({ severity }) => severity === 'warning').length,
    normalizations: review.rows.reduce(
      (total, { normalizations }) => total + normalizations.length,
      0,
    ),
  };
}
