/** Affiche un numéro sénégalais en +221 XX XXX XX XX. */
export function formatSnPhone(raw: string): { display: string; tel: string } {
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
