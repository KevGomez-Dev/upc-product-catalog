export type ImportStatus = 'imported' | 'duplicate' | 'pending';

export interface SourceRow {
  lineStart: number;
  lineEnd: number;
  rawRecord: string;
  sourceFields: string[];
}

export interface Classification {
  categoryCode: string;
  subcategoryCode: string;
}

export interface ProductInput extends Classification {
  upcCode: string;
  upcDescription: string;
  dateAdded: Date;
  updatedDate: Date;
  addedBy: string;
  modifiedBy: string;
}

export interface Diagnostic {
  code: string;
  severity: 'error' | 'warning' | 'info';
  field?: string;
  relatedLines?: number[];
}

export interface Normalization {
  field: 'UpcCode' | 'CategoryCode' | 'SubCategoryCode';
  before: string;
  after: string;
}

export interface ReviewedRow extends SourceRow {
  originalId: string | null;
  diagnostics: Diagnostic[];
  normalizations: Normalization[];
  duplicateOfLine?: number;
  product?: ProductInput;
}

export interface ImportSummary {
  rows: number;
  products: number;
  duplicates: number;
  pending: number;
  categories: number;
  subcategories: number;
  users: number;
  warnings: number;
  normalizations: number;
}

export interface CatalogReview {
  sha256: string;
  rows: ReviewedRow[];
}
