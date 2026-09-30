import { stockView } from "@/lib/stock";

export default function StockBadge({
  quantity,
  customizable = false,
}: {
  quantity: number | null | undefined;
  customizable?: boolean;
}) {
  const view = stockView(quantity, customizable);
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${view.className}`}>{view.label}</span>;
}
