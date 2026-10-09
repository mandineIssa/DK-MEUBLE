export const colors = {
  navy: "#1A1A1A",
  navyDark: "#141414",
  black: "#1A1A1A",
  red: "#F68B1E",
  orange: "#F68B1E",
  orangeDark: "#E07D16",
  price: "#F68B1E",
  text: "#1A1A1A",
  muted: "#6E6E6E",
  line: "#E0E0E0",
  bg: "#F5F5F5",
  white: "#FFFFFF",
  star: "#F5A623",
  green: "#2E7D32",
  danger: "#D32F2F",
};

export function formatFcfa(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "Prix sur demande";
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(Number(value)))} FCFA`;
}
