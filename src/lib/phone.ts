/**
 * Phone numbers are stored in E.164 (+995555123456).
 * Georgian numbers are accepted in any common local format; foreign numbers need a leading +.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    const international = trimmed.startsWith("00") ? digits.slice(2) : digits;
    if (international.startsWith("995")) return international.length === 12 ? `+${international}` : null;
    return international.length >= 8 && international.length <= 15 ? `+${international}` : null;
  }
  if (digits.length === 12 && digits.startsWith("995")) return `+${digits}`;
  // National format, optionally with a leading trunk 0: 555 12 34 56, 0555123456, 322 12 34 56.
  const national = digits.length === 10 && digits.startsWith("0") ? digits.slice(1) : digits;
  if (national.length === 9 && /^[2-7]/.test(national)) return `+995${national}`;
  return null;
}

/** "+995 555 12 34 56" for Georgian numbers; other numbers are returned unchanged. */
export function formatPhone(e164: string): string {
  const match = /^\+995(\d{3})(\d{2})(\d{2})(\d{2})$/.exec(e164);
  return match ? `+995 ${match[1]} ${match[2]} ${match[3]} ${match[4]}` : e164;
}

export const contactLinks = {
  call: (e164: string) => `tel:${e164}`,
  whatsapp: (e164: string, text?: string) =>
    `https://wa.me/${e164.replace("+", "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`,
  viber: (e164: string) => `viber://chat?number=${encodeURIComponent(e164)}`,
  telegram: (e164: string) => `https://t.me/${e164}`,
};
