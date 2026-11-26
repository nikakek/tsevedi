/**
 * Seeds reference data only (places). Drivers and listings are never seeded:
 * every listing on Tsevedi comes from a real submission approved in /admin.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PLACES } from "./data/places";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const slugs = new Set<string>();
  for (const place of PLACES) {
    if (slugs.has(place.slug)) throw new Error(`Duplicate place slug: ${place.slug}`);
    slugs.add(place.slug);

    const data = {
      nameKa: place.ka,
      nameEn: place.en,
      nameRu: place.ru,
      aliases: place.aliases ?? [],
      region: place.region,
      kind: place.kind,
      lat: place.lat,
      lng: place.lng,
    };
    await prisma.place.upsert({
      where: { slug: place.slug },
      create: { slug: place.slug, ...data },
      update: data,
    });
  }
  console.log(`Seeded ${PLACES.length} places.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
