type SearchableProduct = {
  name: string;
  category?: string;
  description?: string;
  keywords?: string;
};

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeProductKeywords(value: string) {
  const seen = new Set<string>();
  return value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => {
      const normalized = normalizeSearchText(keyword);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .join(", ");
}

export function getProductSearchRelevance(product: SearchableProduct, searchTerm: string) {
  const normalizedTerm = normalizeSearchText(searchTerm);
  if (!normalizedTerm) return 0;

  const keywords = (product.keywords || "")
    .split(",")
    .map(normalizeSearchText)
    .filter(Boolean);

  if (keywords.some((keyword) => keyword === normalizedTerm)) return 3;
  if (keywords.some((keyword) => keyword.includes(normalizedTerm))) return 2;

  const searchableText = [product.name, product.category || "", product.description || ""]
    .map(normalizeSearchText);
  return searchableText.some((value) => value.includes(normalizedTerm)) ? 1 : 0;
}

export function compareProductSearchRelevance(first: SearchableProduct, second: SearchableProduct, searchTerm: string) {
  return getProductSearchRelevance(second, searchTerm) - getProductSearchRelevance(first, searchTerm);
}
