import type { ComboPlace } from "@/components/place-combobox";

/** Trim places to what the browser needs for autocomplete. */
export function toComboPlaces(places: ComboPlace[]): ComboPlace[] {
  return places.map(({ slug, nameKa, nameEn, nameRu, aliases, region }) => ({
    slug,
    nameKa,
    nameEn,
    nameRu,
    aliases,
    region,
  }));
}
