# Tsevedi public API (v1)

JSON API used by the website's future React Native app and open to anyone building on Tsevedi data.
Base URL: `https://tsevedi.ge/api/v1` (locally `http://localhost:3000/api/v1`).

Every response is either:

```json
{ "data": … }
```

or

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Some fields are invalid",
    "fields": { "phone": "phone" }
  }
}
```

`fields` maps a field name to a validation key (`required`, `phone`, `time`, `url`, `stops`, `duplicateStops`,
`days`, `number`, `tooLong`). Clients translate these keys themselves. The web app uses the `validation` section of
`src/i18n/dictionaries/*.ts`.

| Status | Code                | When                                  |
| ------ | ------------------- | ------------------------------------- |
| 400    | `bad_request`       | Missing or malformed query parameters |
| 404    | `not_found`         | Unknown place or listing              |
| 422    | `validation_failed` | Body failed validation                |
| 429    | `rate_limited`      | Too many write requests from your IP  |

## Places

### `GET /places`

All places with names in Georgian, English and Russian, search aliases, region and approximate coordinates.

```json
{
  "data": [
    {
      "id": "…",
      "slug": "oni",
      "nameKa": "ონი",
      "nameEn": "Oni",
      "nameRu": "Они",
      "aliases": [],
      "region": "racha-lechkhumi",
      "kind": "TOWN",
      "lat": 42.5793,
      "lng": 43.4425
    }
  ]
}
```

Use slugs (`oni`, `stepantsminda`, …) everywhere else in the API. The search logic in `src/lib/place-search.ts` and
`src/lib/translit.ts` has no dependencies and can be copied into a mobile app unchanged.

## Routes

### `GET /routes?from=<slug>&to=<slug>[&date=YYYY-MM-DD]`

Trips from one place to another, including trips where both places are stops along a longer route, and return trips.
With `date`, each result says whether the trip runs that day (weekday and season); trips that run come first.

```json
{
  "data": {
    "from": { "slug": "tbilisi", … },
    "to": { "slug": "oni", … },
    "date": "2026-07-01",
    "reverseCount": 0,
    "results": [{
      "direction": "outbound",
      "boardStop": "tbilisi",
      "alightStop": "oni",
      "departureTime": "09:00",
      "runsOnDate": true,
      "listing": { "id": "…", "pricePerSeat": 25, "days": [1,2,3,4,5,6,7], "activeMonths": [],
        "departurePoint": "Didube bus station", "freshness": "fresh", "verifiedDaysAgo": 3,
        "driver": { "name": "…", "phone": "+995555123456", "whatsapp": true, "languages": ["KA", "RU"], … },
        "stops": [{ "slug": "tbilisi", … }, { "slug": "ambrolauri", … }, { "slug": "oni", … }] }
    }]
  }
}
```

`reverseCount` is the number of listings for the opposite direction, which helps when a search finds nothing.

### `GET /route-pairs`

Distinct origin → destination pairs with the number of listings and the lowest price per seat.

## Listings

### `GET /listings/:id`

One approved listing, including the latest 20 visible traveller reports.

### `POST /listings`

Submit a new route. It is stored as `PENDING` and appears only after an admin has checked it by phone.

```json
{
  "submittedByDriver": true,
  "driverName": "Gela",
  "phone": "555 12 34 56",
  "whatsapp": true,
  "languages": ["KA", "RU"],
  "vehicleType": "MARSHRUTKA",
  "stops": ["tbilisi", "ambrolauri", "oni"],
  "departureTime": "09:00",
  "days": [1, 2, 3, 4, 5, 6, 7],
  "activeMonths": [],
  "departurePoint": "Didube bus station, near the ticket office",
  "returnTime": "15:00",
  "pricePerSeat": 25,
  "callAhead": true
}
```

Optional: `viber`, `telegram`, `vehicleModel`, `vehicleColor`, `plate`, `seats`, `departureMapsUrl`, `returnPoint`,
`priceWholeVehicle`, `largeLuggage`, `notes`, `submitterContact`. Returns `201 { "data": { "id", "status": "PENDING" } }`.

### `POST /listings/:id/ride-reports`

```json
{
  "travelDate": "2026-07-01",
  "outcome": "WORKED",
  "departedAt": "09:10",
  "pricePaid": 25,
  "comment": "…"
}
```

`outcome` is `WORKED`, `DIFFERENT` or `DID_NOT_RUN`. A `WORKED` report counts as a fresh confirmation of the listing.

### `POST /listings/:id/problem-reports`

```json
{ "kind": "WRONG_TIME", "message": "Leaves at 10:00 now" }
```

`kind` is `WRONG_TIME`, `WRONG_PRICE`, `NOT_RUNNING`, `WRONG_PHONE` or `OTHER`.
