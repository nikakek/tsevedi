/**
 * Georgian sentences a traveller can show or send to a driver who speaks only Georgian.
 */

/** Locative case for place names: "ონი" → "ონში", "მესტია" → "მესტიაში", "ქვემო ალვანი" → "ქვემო ალვანში". */
export function kaLocative(name: string): string {
  const words = name.trim().split(/\s+/);
  const last = words.pop() ?? "";
  const stem = last.endsWith("ი") ? last.slice(0, -1) : last;
  return [...words, `${stem}ში`].join(" ");
}

/** Ablative ("from X"): "ონი" → "ონიდან", "მესტია" → "მესტიიდან", "ბაქო" → "ბაქოდან". */
export function kaFrom(name: string): string {
  const words = name.trim().split(/\s+/);
  const last = words.pop() ?? "";
  let form: string;
  if (last.endsWith("ი")) form = `${last}დან`;
  else if (last.endsWith("ა")) form = `${last.slice(0, -1)}იდან`;
  else form = `${last}დან`;
  return [...words, form].join(" ");
}

export type PhraseInput = {
  toKa: string;
  fromKa?: string;
  price?: number | null;
  seats?: number;
};

/** Shown full-screen to the driver at the station. */
export function driverCardPhrase({ toKa, price, seats = 1 }: PhraseInput): string[] {
  const lines = ["გამარჯობა!", `${kaLocative(toKa)} მინდა წასვლა.`];
  lines.push(seats > 1 ? `${seats} ადგილი მჭირდება.` : "ერთი ადგილი მჭირდება.");
  if (price) lines.push(`ფასი ${price} ლარია, ასეა?`);
  lines.push("რომელ საათზე გავდივართ?");
  return lines;
}

/** Shown to hostel / guesthouse staff so they can phone the driver for the traveller. */
export function callForMePhrase({ toKa, fromKa }: PhraseInput): string[] {
  return [
    "გამარჯობა! ქართული არ ვიცი.",
    "შეგიძლიათ, დაურეკოთ ამ მძღოლს და დამიჯავშნოთ ადგილი?",
    fromKa ? `მივდივარ ${kaFrom(fromKa)} ${kaLocative(toKa)}.` : `მივდივარ ${kaLocative(toKa)}.`,
    "დიდი მადლობა!",
  ];
}

/** Pre-filled WhatsApp / Viber message, in Georgian, sent from the traveller's phone. */
export function messagePhrase(
  { toKa, fromKa, seats = 1 }: PhraseInput,
  dateLabel?: string,
): string {
  const route = fromKa ? `${kaFrom(fromKa)} ${kaLocative(toKa)}` : kaLocative(toKa);
  const when = dateLabel ? ` ${dateLabel}` : "";
  const seatText = seats > 1 ? `${seats} ადგილი` : "ერთი ადგილი";
  return `გამარჯობა! Tsevedi.ge-ზე გიპოვეთ. მინდა წამოვიდე ${route}${when}. ${seatText} თუ გაქვთ თავისუფალი? (I found you on Tsevedi.ge and would like to book a seat.)`;
}
