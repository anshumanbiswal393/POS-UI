/**
 * Intelligent Multi-Field Fuzzy Search Utility for POS SaaS
 * Supports:
 * - Case-insensitive multi-field search
 * - Partial and substring matching
 * - Levenshtein-based typo tolerance ("samprtia" -> "Samprita", "chiken" -> "Chicken")
 * - Word boundary and prefix matching ("Samprita P" -> "Samprita Patra")
 * - Number and text search (phone, amounts, order IDs, table numbers)
 * - Nested objects, arrays, and related records (items in order, payments, guests)
 * - Automatic date format expansion (searches match both 14-11-2026 and 2026-11-14)
 */

import { formatDateIndian } from "./dateUtils";

/**
 * Compute fast Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array(n + 1);
  let curr = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const char1 = s1.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const char2 = s2.charCodeAt(j - 1);
      const cost = char1 === char2 ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost // substitution
      );
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }

  return prev[n];
}

/**
 * Check if all characters in term appear in order in target
 */
function isSubsequence(term: string, target: string): boolean {
  let tIdx = 0;
  for (let i = 0; i < target.length && tIdx < term.length; i++) {
    if (target[i] === term[tIdx]) {
      tIdx++;
    }
  }
  return tIdx === term.length;
}

/**
 * Match a single search term against a string target.
 * Returns { matched: boolean, score: number }
 */
export function matchTermAgainstString(
  term: string,
  target: string,
): { matched: boolean; score: number } {
  if (!term || !target) return { matched: false, score: 0 };

  const tTerm = term.toLowerCase().trim();
  const tTarget = target.toLowerCase().trim();

  if (!tTerm || !tTarget) return { matched: false, score: 0 };

  // 1. Exact match
  if (tTarget === tTerm) {
    return { matched: true, score: 100 };
  }

  // 2. Starts with
  if (tTarget.startsWith(tTerm)) {
    return { matched: true, score: 90 };
  }

  // 3. Substring match
  const subIdx = tTarget.indexOf(tTerm);
  if (subIdx !== -1) {
    // If it matches at word boundary
    const isWordStart = subIdx === 0 || /[\s\-_/.,()]/.test(tTarget[subIdx - 1]);
    return { matched: true, score: isWordStart ? 85 : 75 };
  }

  // 4. Word-prefix matching across individual words in target
  const words = tTarget.split(/[\s\-_/.,()]+/);
  for (const word of words) {
    if (!word) continue;
    if (word.startsWith(tTerm)) {
      return { matched: true, score: 80 };
    }
    // Typo tolerance against individual words
    if (tTerm.length >= 3) {
      const maxDistance = tTerm.length <= 4 ? 1 : 2;
      // Compare word or prefix of word
      const wordPrefix = word.slice(0, Math.min(word.length, tTerm.length + 1));
      const dist = levenshteinDistance(tTerm, wordPrefix);
      if (dist <= maxDistance) {
        return { matched: true, score: 70 - dist * 5 };
      }
    }
  }

  // 5. Overall Levenshtein typo match (if lengths are comparable)
  if (tTerm.length >= 3 && Math.abs(tTarget.length - tTerm.length) <= 2) {
    const maxDistance = tTerm.length <= 4 ? 1 : 2;
    const dist = levenshteinDistance(tTerm, tTarget);
    if (dist <= maxDistance) {
      return { matched: true, score: 65 - dist * 5 };
    }
  }

  // 6. Subsequence match
  if (tTerm.length >= 2 && isSubsequence(tTerm, tTarget)) {
    return { matched: true, score: 50 };
  }

  return { matched: false, score: 0 };
}

/**
 * Recursively extract all searchable text representations from a record.
 */
export function extractSearchableFields(item: any, depth = 0): string[] {
  if (item === null || item === undefined || depth > 3) return [];

  if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
    const s = String(item).trim();
    if (!s) return [];
    const results = [s];
    // If it looks like a date, also add the DD-MM-YYYY format
    if (typeof item === "string" && /^\d{4}-\d{2}-\d{2}/.test(s)) {
      const indianDate = formatDateIndian(s, "");
      if (indianDate) results.push(indianDate);
    }
    return results;
  }

  if (Array.isArray(item)) {
    const arrResults: string[] = [];
    for (const el of item) {
      arrResults.push(...extractSearchableFields(el, depth + 1));
    }
    return arrResults;
  }

  if (typeof item === "object") {
    const objResults: string[] = [];
    for (const key of Object.keys(item)) {
      // Skip internal or function properties
      if (key.startsWith("_") || key === "children" || typeof item[key] === "function") {
        continue;
      }
      objResults.push(...extractSearchableFields(item[key], depth + 1));
    }
    return objResults;
  }

  return [];
}

/**
 * Matches a query against a set of candidate searchable strings.
 * Every term in the query must match at least one candidate string.
 */
export function matchQueryAgainstStrings(
  query: string,
  searchableStrings: string[],
): { matched: boolean; score: number } {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return { matched: true, score: 0 };
  if (searchableStrings.length === 0) return { matched: false, score: 0 };

  let totalScore = 0;

  for (const term of terms) {
    let termMatched = false;
    let bestTermScore = 0;

    for (const str of searchableStrings) {
      const res = matchTermAgainstString(term, str);
      if (res.matched) {
        termMatched = true;
        if (res.score > bestTermScore) {
          bestTermScore = res.score;
        }
      }
    }

    if (!termMatched) {
      return { matched: false, score: 0 };
    }
    totalScore += bestTermScore;
  }

  return { matched: true, score: totalScore };
}

/**
 * Tests if an item matches a search query using multi-field fuzzy matching.
 */
export function fuzzyMatch(
  item: any,
  query: string,
  fieldGetters?: Array<(item: any) => any>,
): boolean {
  if (!query || !query.trim()) return true;

  let searchable: string[];
  if (fieldGetters && fieldGetters.length > 0) {
    searchable = [];
    for (const getter of fieldGetters) {
      try {
        const val = getter(item);
        searchable.push(...extractSearchableFields(val));
      } catch {
        // ignore getter error
      }
    }
  } else {
    searchable = extractSearchableFields(item);
  }

  return matchQueryAgainstStrings(query, searchable).matched;
}

/**
 * Filter an array of items using intelligent multi-field fuzzy matching.
 * Preserves or ranks items by relevance match score.
 */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  fieldGetters?: Array<(item: T) => any>,
): T[] {
  if (!query || !query.trim()) return items;
  if (!Array.isArray(items) || items.length === 0) return [];

  const results: { item: T; score: number; originalIndex: number }[] = [];

  items.forEach((item, index) => {
    let searchable: string[];
    if (fieldGetters && fieldGetters.length > 0) {
      searchable = [];
      for (const getter of fieldGetters) {
        try {
          const val = getter(item);
          searchable.push(...extractSearchableFields(val));
        } catch {
          // ignore getter error
        }
      }
    } else {
      searchable = extractSearchableFields(item);
    }

    const { matched, score } = matchQueryAgainstStrings(query, searchable);
    if (matched) {
      results.push({ item, score, originalIndex: index });
    }
  });

  // Sort by score descending; if scores are close, preserve original table order
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.originalIndex - b.originalIndex;
  });

  return results.map((r) => r.item);
}
