# Contributing to Tsevedi

Thanks for helping. There are three common kinds of contribution.

## Add or fix a route

Use **Add a route** on the website, or **Report a problem** on a listing. Routes are never added through pull
requests: every listing is confirmed with the driver by phone first.

## Add a place

Places live in [`prisma/data/places.ts`](prisma/data/places.ts). Add an entry with:

- a lowercase Latin `slug` (it becomes part of URLs, so never rename an existing one)
- names in Georgian (`ka`), English (`en`) and Russian (`ru`)
- the `region` key and `kind`
- approximate town-centre coordinates
- `aliases` for other spellings people search for (old names, alternative transliterations, the region name)

Then run `npm run db:seed` (it upserts, so it's safe to run repeatedly) and check that the place shows up in search.

## Code

```bash
npm run lint && npm run typecheck && npm run format:check && npm test
npm run test:e2e   # needs the local database (npm run db:up)
```

- Keep business logic in `src/lib` as pure functions with unit tests. Keep database access in `src/server`.
- Every user-facing string goes in all three dictionaries in `src/i18n/dictionaries`. TypeScript reports any key
  missing from `ka.ts` or `ru.ts`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`, …).
