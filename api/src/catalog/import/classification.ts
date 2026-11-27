import type { Classification, Normalization, SourceRow } from './import.types';
import { fieldCount } from './read-csv';

export function classificationKey(
  categoryCode: string,
  subcategoryCode: string,
): string {
  return JSON.stringify([categoryCode, subcategoryCode]);
}

export function observedClassifications(rows: SourceRow[]): Set<string> {
  const ownersBySubcategory = new Map<string, Set<string>>();
  for (const { sourceFields } of rows) {
    if (sourceFields.length !== fieldCount) continue;

    const [, , , category, subcategory] = sourceFields;
    if (
      !category ||
      !subcategory ||
      category.trim() !== category ||
      subcategory.trim() !== subcategory ||
      category !== category.toUpperCase() ||
      subcategory !== subcategory.toUpperCase()
    ) {
      continue;
    }

    const owners = ownersBySubcategory.get(subcategory) ?? new Set<string>();
    owners.add(category);
    ownersBySubcategory.set(subcategory, owners);
  }

  const pairs = new Set<string>();
  for (const [subcategory, owners] of ownersBySubcategory) {
    // With contradictory observations, use the source's CATEGORY-SUBCODE
    // convention only to confirm a pair that already exists in the file.
    const candidates = [...owners];
    const confirmed =
      candidates.length === 1
        ? candidates
        : candidates.filter((category) =>
            subcategory.startsWith(`${category}-`),
          );
    if (confirmed.length === 1) {
      pairs.add(classificationKey(confirmed[0], subcategory));
    }
  }
  return pairs;
}

export function resolveClassification(
  rawCategory: string,
  rawSubcategory: string,
  observed: Set<string>,
  normalizations: Normalization[],
): Classification | undefined {
  const categoryCode = rawCategory.toUpperCase();
  const subcategoryCode = rawSubcategory.toUpperCase();
  if (
    (rawCategory !== categoryCode &&
      rawCategory !== rawCategory.toLowerCase()) ||
    (rawSubcategory !== subcategoryCode &&
      rawSubcategory !== rawSubcategory.toLowerCase()) ||
    rawCategory.trim() !== rawCategory ||
    rawSubcategory.trim() !== rawSubcategory ||
    !observed.has(classificationKey(categoryCode, subcategoryCode))
  ) {
    return undefined;
  }

  if (rawCategory !== categoryCode) {
    normalizations.push({
      field: 'CategoryCode',
      before: rawCategory,
      after: categoryCode,
    });
  }
  if (rawSubcategory !== subcategoryCode) {
    normalizations.push({
      field: 'SubCategoryCode',
      before: rawSubcategory,
      after: subcategoryCode,
    });
  }
  return { categoryCode, subcategoryCode };
}

export function collectClassifications(classifications: Classification[]) {
  const pairs = new Map<string, Classification>();
  const categories = new Set<string>();
  for (const pair of classifications) {
    pairs.set(classificationKey(pair.categoryCode, pair.subcategoryCode), {
      categoryCode: pair.categoryCode,
      subcategoryCode: pair.subcategoryCode,
    });
    categories.add(pair.categoryCode);
  }
  return { categories: [...categories], subcategories: [...pairs.values()] };
}
