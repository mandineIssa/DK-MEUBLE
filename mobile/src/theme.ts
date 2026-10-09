export const colors = {
  navy: "#0C2D6B",
  navyDark: "#081E4A",
  red: "#E10600",
  price: "#C8102E",
  text: "#1A1A1A",
  muted: "#6E7580",
  line: "#E6E8EE",
  bg: "#F6F7F9",
  white: "#FFFFFF",
  star: "#F5A623",
  green: "#1B7A3A",
};

export function formatFcfa(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "Prix sur demande";
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(Number(value)))} FCFA`;
}
