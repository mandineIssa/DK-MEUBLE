export type StockView = { label: string; className: string };

export function stockView(quantity: number | null | undefined, customizable = false): StockView {
  if (quantity == null) {
    return { label: "Disponible", className: "bg-green-100 text-green-800" };
  }
  if (quantity <= 0) {
    return customizable
      ? { label: "Sur commande", className: "bg-blue-100 text-blue-800" }
      : { label: "Rupture", className: "bg-red-100 text-red-700" };
  }
  if (quantity <= 3) {
    return { label: "Stock limité", className: "bg-orange-100 text-orange-800" };
  }
  return { label: "Disponible", className: "bg-green-100 text-green-800" };
}
