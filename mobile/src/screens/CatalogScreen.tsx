import { useCallback, useEffect, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { api, type Category, type Product } from "../api";
import { AppHeader, EmptyText, PrimaryButton, ProductCard, ScreenLoader, useAppNav, type RootParamList } from "../ui";
import { colors } from "../theme";

const SORTS = [
  { value: "", label: "Récents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "promo", label: "Promotions" },
];

export function CatalogScreen() {
  const route = useRoute<RouteProp<RootParamList, "Catalog">>();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const mode = route.params.mode;
    const params: Record<string, string> = {};
    if (sort) params.sort = sort;
    const load =
      mode === "promo"
        ? api.promotions().then((res) =>
            (res.data || [])
              .map((row) => row.product)
              .filter((p): p is Product => Boolean(p))
          )
        : mode === "clearance"
          ? api.products({ clearance: "1", ...params })
          : mode === "refurbished"
            ? api.products({ condition: "reconditionne", ...params })
            : api.products(params);
    setLoading(true);
    setError("");
    load
      .then((rows) => {
        const priceOf = (p: Product) => p.effective_price ?? p.promo_price ?? p.price ?? 0;
        const next = [...rows];
        if (mode === "promo" && sort === "price_asc") next.sort((a, b) => (priceOf(a) || 0) - (priceOf(b) || 0));
        if (mode === "promo" && sort === "price_desc") next.sort((a, b) => (priceOf(b) || 0) - (priceOf(a) || 0));
        setItems(next);
      })
      .catch(() => {
        setItems([]);
        setError("Impossible de charger les produits.");
      })
      .finally(() => setLoading(false));
  }, [route.params.mode, sort, reload]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.navy, paddingHorizontal: 14 }}>{route.params.title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
        {SORTS.map((item) => (
          <Pressable key={item.label} onPress={() => setSort(item.value)} style={chip(sort === item.value)}>
            <Text style={{ color: sort === item.value ? colors.white : colors.text, fontWeight: "700" }}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {loading ? <ScreenLoader /> : null}
      {!loading && error ? (
        <View style={{ padding: 16 }}>
          <EmptyText>{error}</EmptyText>
          <PrimaryButton label="Réessayer" onPress={() => setReload((n) => n + 1)} />
        </View>
      ) : null}
      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          columnWrapperStyle={items.length ? { justifyContent: "space-between" } : undefined}
          ListEmptyComponent={<EmptyText>Aucun produit pour le moment.</EmptyText>}
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      ) : null}
    </View>
  );
}

export function CategoryScreen() {
  const route = useRoute<RouteProp<RootParamList, "Category">>();
  const nav = useAppNav();
  const [items, setItems] = useState<Product[]>([]);
  const [children, setChildren] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Array<{ name: string; slug: string }>>([]);
  const [conditions, setConditions] = useState<Array<{ value: string; label: string }>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("newest");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [stock, setStock] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [draft, setDraft] = useState({ brand: "", condition: "", stock: "", minPrice: "", maxPrice: "" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reload, setReload] = useState(0);

  const load = useCallback(() => {
    const params: Record<string, string> = { sort };
    if (brand) params.brand = brand;
    if (condition) params.condition = condition;
    if (stock) params.in_stock = stock;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    setLoading(true);
    setError("");
    api
      .category(route.params.slug, params)
      .then((res) => {
        setItems(res.products || []);
        setChildren(res.children || []);
        setBrands(res.facets?.brands || []);
        setConditions(res.facets?.conditions || []);
        setTotal(res.meta?.total ?? (res.products || []).length);
      })
      .catch(() => {
        setItems([]);
        setError("Impossible de charger cette catégorie.");
      })
      .finally(() => setLoading(false));
  }, [route.params.slug, sort, brand, condition, stock, minPrice, maxPrice]);

  useEffect(() => {
    load();
  }, [load, reload]);

  function apply() {
    setBrand(draft.brand);
    setCondition(draft.condition);
    setStock(draft.stock);
    setMinPrice(draft.minPrice.replace(/\D/g, ""));
    setMaxPrice(draft.maxPrice.replace(/\D/g, ""));
    setFiltersOpen(false);
  }

  function reset() {
    const empty = { brand: "", condition: "", stock: "", minPrice: "", maxPrice: "" };
    setDraft(empty);
    setBrand("");
    setCondition("");
    setStock("");
    setMinPrice("");
    setMaxPrice("");
    setFiltersOpen(false);
  }

  const chips = [
    brand ? { key: "brand", label: brands.find((b) => b.slug === brand)?.name || brand, clear: () => setBrand("") } : null,
    condition ? { key: "condition", label: conditions.find((c) => c.value === condition)?.label || condition, clear: () => setCondition("") } : null,
    stock === "1" ? { key: "stock", label: "En stock", clear: () => setStock("") } : null,
    minPrice ? { key: "min", label: `Dès ${minPrice} FCFA`, clear: () => setMinPrice("") } : null,
    maxPrice ? { key: "max", label: `Jusqu'à ${maxPrice} FCFA`, clear: () => setMaxPrice("") } : null,
  ].filter((chip): chip is { key: string; label: string; clear: () => void } => Boolean(chip));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.navy, paddingHorizontal: 14 }}>{route.params.title}</Text>
      <Text style={{ color: colors.muted, paddingHorizontal: 14 }}>{total} produit{total > 1 ? "s" : ""}</Text>
      {children.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, gap: 8 }}>
          {children.map((child) => (
            <Pressable key={child.id} onPress={() => nav.navigate("Category", { slug: child.slug, title: child.name })} style={chip(false)}>
              <Text style={{ fontWeight: "700", color: colors.text }}>{child.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
        <Pressable onPress={() => { setDraft({ brand, condition, stock, minPrice, maxPrice }); setFiltersOpen(true); }} style={[chip(false), { minHeight: 44 }]}>
          <Text style={{ fontWeight: "800", color: colors.text }}>Filtrer</Text>
        </Pressable>
        {SORTS.map((item) => (
          <Pressable key={item.value || "recent"} onPress={() => setSort(item.value || "newest")} style={[chip((item.value || "newest") === sort), { minHeight: 44 }]}>
            <Text style={{ color: (item.value || "newest") === sort ? colors.white : colors.text, fontWeight: "700" }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {chips.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
          {chips.map((item) => (
            <Pressable key={item.key} onPress={item.clear} style={chip(true)}>
              <Text style={{ color: colors.white, fontWeight: "700" }}>{item.label}  ×</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {loading ? <ScreenLoader /> : null}
      {!loading && error ? (
        <View style={{ padding: 16 }}>
          <EmptyText>{error}</EmptyText>
          <PrimaryButton label="Réessayer" onPress={() => setReload((n) => n + 1)} />
        </View>
      ) : null}
      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          columnWrapperStyle={items.length ? { justifyContent: "space-between" } : undefined}
          ListEmptyComponent={<EmptyText>Aucun produit ne correspond à ces critères.</EmptyText>}
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      ) : null}
      <Modal visible={filtersOpen} animationType="slide" transparent onRequestClose={() => setFiltersOpen(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }}>
          <View style={{ maxHeight: "80%", backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.navy, marginBottom: 8 }}>Filtres</Text>
            <ScrollView>
              <Text style={label}>Prix min (FCFA)</Text>
              <TextInput value={draft.minPrice} onChangeText={(v) => setDraft((d) => ({ ...d, minPrice: v.replace(/\D/g, "") }))} keyboardType="number-pad" style={input} />
              <Text style={label}>Prix max (FCFA)</Text>
              <TextInput value={draft.maxPrice} onChangeText={(v) => setDraft((d) => ({ ...d, maxPrice: v.replace(/\D/g, "") }))} keyboardType="number-pad" style={input} />
              {brands.length ? <Text style={label}>Marque</Text> : null}
              {brands.map((item) => (
                <Pressable key={item.slug} onPress={() => setDraft((d) => ({ ...d, brand: d.brand === item.slug ? "" : item.slug }))} style={chip(draft.brand === item.slug)}>
                  <Text style={{ color: draft.brand === item.slug ? colors.white : colors.text, fontWeight: "700" }}>{item.name}</Text>
                </Pressable>
              ))}
              {conditions.length ? <Text style={label}>État</Text> : null}
              {conditions.map((item) => (
                <Pressable key={item.value} onPress={() => setDraft((d) => ({ ...d, condition: d.condition === item.value ? "" : item.value }))} style={chip(draft.condition === item.value)}>
                  <Text style={{ color: draft.condition === item.value ? colors.white : colors.text, fontWeight: "700" }}>{item.label}</Text>
                </Pressable>
              ))}
              <Text style={label}>Disponibilité</Text>
              <Pressable onPress={() => setDraft((d) => ({ ...d, stock: d.stock === "1" ? "" : "1" }))} style={chip(draft.stock === "1")}>
                <Text style={{ color: draft.stock === "1" ? colors.white : colors.text, fontWeight: "700" }}>En stock</Text>
              </Pressable>
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <Pressable onPress={reset} style={[chip(false), { flex: 1, minHeight: 48, alignItems: "center" }]}>
                <Text style={{ fontWeight: "800" }}>Réinitialiser</Text>
              </Pressable>
              <Pressable onPress={apply} style={[chip(true), { flex: 1, minHeight: 48, alignItems: "center" }]}>
                <Text style={{ color: colors.white, fontWeight: "800" }}>Appliquer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function chip(on: boolean) {
  return {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    marginRight: 8,
    backgroundColor: on ? colors.black : colors.white,
    borderWidth: 1,
    borderColor: on ? colors.black : colors.line,
    alignSelf: "flex-start" as const,
  };
}

const label = { fontWeight: "800" as const, color: colors.navy, marginTop: 8, marginBottom: 4 };
const input = {
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: 10,
  minHeight: 48,
  paddingHorizontal: 12,
  fontSize: 16,
  color: colors.text,
};
