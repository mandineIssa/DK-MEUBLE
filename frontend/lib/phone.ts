export type SnPhone = { display: string; tel: string };

/** Affiche un numéro sénégalais en +221 XX XXX XX XX. */
export function formatSnPhone(raw: string): SnPhone {
  const digits = String(raw || "").replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("00221")) local = local.slice(5);
  else if (local.startsWith("221") && local.length > 9) local = local.slice(3);
  if (local.length === 9) {
    const display = `+221 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
    return { display, tel: `+221${local}` };
  }
  const trimmed = String(raw || "").trim();
  return { display: trimmed, tel: trimmed.replace(/\s/g, "") };
}

/**
 * Un ou plusieurs numéros (virgule, point-virgule, saut de ligne, ou deux numéros collés).
 * Chaque numéro local à 9 chiffres reçoit le préfixe +221.
 */
export function formatSnPhones(raw: string): SnPhone[] {
  const chunks = String(raw || "")
    .split(/[,;|\n/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const out: SnPhone[] = [];

  for (const chunk of chunks) {
    const digits = chunk.replace(/\D/g, "").replace(/^00/, "");
    if (digits.length > 9 && digits.length % 9 === 0 && !digits.startsWith("221")) {
      for (let i = 0; i < digits.length; i += 9) {
        out.push(formatSnPhone(digits.slice(i, i + 9)));
      }
      continue;
    }
    if (digits.length > 12 && digits.startsWith("221") && digits.length % 12 === 0) {
      for (let i = 0; i < digits.length; i += 12) {
        out.push(formatSnPhone(digits.slice(i, i + 12)));
      }
      continue;
    }
    const one = formatSnPhone(chunk);
    if (one.display) out.push(one);
  }

  return out;
}
