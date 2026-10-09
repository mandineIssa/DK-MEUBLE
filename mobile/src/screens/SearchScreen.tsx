import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { api, type Product } from "../api";
import { AppHeader, EmptyText, ProductCard, ScreenLoader, SearchBar, useAppNav, type RootParamList } from "../ui";
import { colors } from "../theme";

export default function SearchScreen() {
  const route = useRoute<RouteProp<RootParamList, "Search">>();
  const [q, setQ] = useState(route.params?.q || "");
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function run(term: string) {
    const query = term.trim();
    if (!query) return;
    setLoading(true);
    try {
      setItems(await api.products({ search: query }));
      setDone(true);
    } catch {
      setItems([]);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (route.params?.q) run(route.params.q);
  }, [route.params?.q]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <SearchBar value={q} onChange={setQ} onSubmit={() => run(q)} />
      {loading ? <ScreenLoader /> : null}
      {!loading ? (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ padding: 12 }}
          columnWrapperStyle={items.length ? { justifyContent: "space-between" } : undefined}
          ListEmptyComponent={done ? <EmptyText>Aucun produit ne correspond à cette recherche.</EmptyText> : null}
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      ) : null}
    </View>
  );
}

export function MenuScreen() {
  const nav = useAppNav();
  const rows: Array<{ label: string; go: () => void }> = [
    { label: "Promotions", go: () => nav.navigate("Catalog", { mode: "promo", title: "Promotions" }) },
    { label: "Nouveautés", go: () => nav.navigate("Catalog", { mode: "new", title: "Nouveautés" }) },
    { label: "Recherche", go: () => nav.navigate("Search") },
    { label: "Favoris", go: () => nav.navigate("Wishlist") },
    { label: "Mes commandes", go: () => nav.navigate("Orders") },
    { label: "Suivre une commande", go: () => nav.navigate("Track") },
    { label: "Contact", go: () => nav.navigate("Contact") },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.navy, padding: 14 }}>Menu</Text>
      {rows.map((row) => (
        <Text key={row.label} onPress={row.go} style={{ backgroundColor: colors.white, marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 10, fontWeight: "700", color: colors.navy }}>
          {row.label}
        </Text>
      ))}
    </View>
  );
}
