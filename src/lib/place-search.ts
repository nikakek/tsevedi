import { searchKey } from "./translit";

export type SearchablePlace = {
  slug: string;
  nameKa: string;
  nameEn: string;
  nameRu: string;
  aliases: string[];
};

export type PlaceIndexEntry<P extends SearchablePlace> = { place: P; keys: string[] };

/** Precompute comparison keys once; the index is reused for every keystroke. */
export function buildPlaceIndex<P extends SearchablePlace>(places: P[]): PlaceIndexEntry<P>[] {
  return places.map((place) => {
    const names = [place.nameEn, place.nameKa, place.nameRu, place.slug, ...place.aliases];
    // "Stepantsminda (Kazbegi)" should match both parts on their own.
    const parts = names.flatMap((name) => name.split(/[()\/,]/));
    const keys = [...new Set([...names, ...parts].map(searchKey).filter(Boolean))];
    return { place, keys };
  });
}

/** Levenshtein distance, stopping early once it exceeds `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > max) return max + 1;
    previous = current;
  }
  return previous[b.length];
}

function scoreKey(query: string, key: string): number {
  if (key === query) return 100;
  if (key.startsWith(query)) return 80 - Math.min(key.length - query.length, 20);
  if (query.length >= 3 && key.includes(query)) return 50;
  // Typo tolerance: compare the query with the start of the name ("ambrolari" ≈ "ambrolauri").
  if (query.length >= 4) {
    const allowed = query.length >= 7 ? 2 : 1;
    const distance = Math.min(
      editDistance(query, key.slice(0, query.length), allowed),
      editDistance(query, key, allowed),
    );
    if (distance <= allowed) return 30 - distance * 10;
  }
  return 0;
}

/** Best matches first. An empty query returns no results. */
export function searchPlaces<P extends SearchablePlace>(
  index: PlaceIndexEntry<P>[],
  query: string,
  limit = 8,
): P[] {
  const q = searchKey(query);
  if (!q) return [];
  return index
    .map(({ place, keys }) => ({ place, score: Math.max(...keys.map((key) => scoreKey(q, key))) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.place.nameEn.localeCompare(b.place.nameEn))
    .slice(0, limit)
    .map((result) => result.place);
}
