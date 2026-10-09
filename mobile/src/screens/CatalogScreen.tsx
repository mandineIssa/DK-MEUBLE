import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { api, type Product } from "../api";
import { AppHeader, EmptyText, ProductCard, ScreenLoader, type RootParamList } from "../ui";
import { colors } from "../theme";

export function CatalogScreen() {
  const route = useRoute<RouteProp<RootParamList, "Catalog">>();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mode = route.params.mode;
    const load =
      mode === "promo"
        ? api.promotions().then((res) =>
            (res.data || [])
              .map((row) => row.product)
              .filter((p): p is Product => Boolean(p))
          )
        : mode === "clearance"
          ? api.products({ clearance: "1" })
          : mode === "refurbished"
            ? api.products({ condition: "reconditionne" })
            : api.products({});
    load
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [route.params.mode]);

  if (loading) return <ScreenLoader />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.navy, paddingHorizontal: 14 }}>{route.params.title}</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        ListEmptyComponent={<EmptyText>Aucun produit pour le moment.</EmptyText>}
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}

export function CategoryScreen() {
  const route = useRoute<RouteProp<RootParamList, "Category">>();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .category(route.params.slug)
      .then((res) => setItems(res.products || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [route.params.slug]);

  if (loading) return <ScreenLoader />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.navy, paddingHorizontal: 14 }}>{route.params.title}</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        ListEmptyComponent={<EmptyText>Aucun produit dans cette catégorie.</EmptyText>}
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}
