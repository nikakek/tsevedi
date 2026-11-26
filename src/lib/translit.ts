/**
 * Place-name normalisation so that "ყაზბეგი", "Казбеги", "Kazbegi" and "kazbegy" all match.
 *
 * 1. Georgian (Mkhedruli) and Cyrillic are transliterated to Latin.
 * 2. `searchKey` then folds spellings that differ between romanisation systems
 *    (q/k/kh, gh/g, ts/c, y/i, ...) into one skeleton used only for comparison.
 */

const GEORGIAN: Record<string, string> = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k",
  ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p", ჟ: "zh", რ: "r", ს: "s", ტ: "t", უ: "u",
  ფ: "p", ქ: "k", ღ: "gh", ყ: "q", შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "ts", ჭ: "ch",
  ხ: "kh", ჯ: "j", ჰ: "h",
};

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};

/** Lowercase Latin transliteration of Georgian / Russian text. Other characters pass through. */
export function transliterate(input: string): string {
  let out = "";
  for (const char of input.toLowerCase()) {
    out += GEORGIAN[char] ?? CYRILLIC[char] ?? char;
  }
  return out;
}

/** Order matters: multi-letter sequences are folded before single letters. */
const FOLDS: Array<[RegExp, string]> = [
  [/shch/g, "sh"],
  [/kh/g, "k"],
  [/gh/g, "g"],
  [/zh/g, "j"],
  [/dzh/g, "j"],
  [/dz/g, "z"],
  [/ts/g, "c"],
  [/tc/g, "c"],
  [/ch/g, "c"],
  [/sh/g, "s"],
  [/q/g, "k"],
  [/y/g, "i"],
  [/w/g, "v"],
  [/f/g, "p"],
  [/x/g, "k"],
  [/(.)\1+/g, "$1"],
];

/** Comparison skeleton: transliterated, accents and punctuation removed, spelling variants folded. */
export function searchKey(input: string): string {
  let key = transliterate(input)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
  for (const [pattern, replacement] of FOLDS) key = key.replace(pattern, replacement);
  return key;
}

/** URL-safe slug from any script, e.g. "ქვემო ალვანი" → "kvemo-alvani". */
export function slugify(input: string): string {
  return transliterate(input)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
