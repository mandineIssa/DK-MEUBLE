import { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { api, type Category, type Product } from "../api";
import { AppHeader, EmptyText, PrimaryButton, ProductCard, ScreenLoader, SearchBar, useAppNav } from "../ui";
import { colors } from "../theme";

export default function SearchScreen() {
  const route = useRoute();
  const initial = ((route.params as { q?: string } | undefined)?.q || "").trim();
  const nav = useAppNav();
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      setDone(false);
      setError("");
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      api
        .products({ search: term })
        .then((rows) => {
          setItems(rows);
          setDone(true);
        })
        .catch(() => {
          setItems([]);
          setDone(true);
          setError("La recherche n’a pas abouti.");
        })
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [q, retry]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <SearchBar value={q} onChange={setQ} onSubmit={() => setQ(q.trim())} />
      {loading ? <ScreenLoader /> : null}
      {!loading && error ? (
        <View style={{ padding: 16 }}>
          <EmptyText>{error}</EmptyText>
          <PrimaryButton label="Réessayer" onPress={() => setRetry((n) => n + 1)} />
        </View>
      ) : null}
      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          columnWrapperStyle={items.length ? { justifyContent: "space-between" } : undefined}
          ListEmptyComponent={
            done ? (
              <View>
                <EmptyText>Aucun produit ne correspond à cette recherche.</EmptyText>
                <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                  <PrimaryButton label="Voir les catégories" onPress={() => nav.navigate("Tabs", { screen: "Catégories" })} />
                </View>
              </View>
            ) : (
              <EmptyText>Saisissez au moins 2 lettres : nom, marque ou référence.</EmptyText>
            )
          }
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      ) : null}
    </View>
  );
}

export function MenuScreen() {
  const nav = useAppNav();
  const [tree, setTree] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api
      .categories()
      .then((res) => setTree(res.tree || []))
      .catch(() => setTree([]));
  }, []);

  function go(action: () => void) {
    if (nav.canGoBack()) nav.goBack();
    setTimeout(action, 40);
  }

  const rows: Array<{ label: string; go: () => void }> = [
    { label: "Accueil", go: () => go(() => nav.navigate("Tabs", { screen: "Accueil" })) },
    { label: "Produits", go: () => go(() => nav.navigate("Catalog", { mode: "all", title: "Produits" })) },
    { label: "Promotions", go: () => go(() => nav.navigate("Catalog", { mode: "promo", title: "Promotions" })) },
    { label: "Services", go: () => go(() => nav.navigate("Services")) },
    { label: "Entreprises", go: () => go(() => nav.navigate("Quote")) },
    { label: "Reconditionné", go: () => go(() => nav.navigate("Catalog", { mode: "refurbished", title: "Reconditionné" })) },
    { label: "Déstockage", go: () => go(() => nav.navigate("Catalog", { mode: "clearance", title: "Déstockage" })) },
    { label: "Contact", go: () => go(() => nav.navigate("Contact")) },
    { label: "Nouveautés", go: () => go(() => nav.navigate("Catalog", { mode: "new", title: "Nouveautés" })) },
    { label: "Marques", go: () => go(() => nav.navigate("Brands")) },
    { label: "Showrooms", go: () => go(() => nav.navigate("Showrooms")) },
    { label: "Réalisations", go: () => go(() => nav.navigate("Realizations")) },
    { label: "Livraison", go: () => go(() => nav.navigate("Info", { key: "delivery", title: "Livraison" })) },
    { label: "À propos", go: () => go(() => nav.navigate("Info", { key: "about", title: "À propos" })) },
    { label: "Mes commandes", go: () => go(() => nav.navigate("Orders")) },
    { label: "Suivre une commande", go: () => go(() => nav.navigate("Track")) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>Menu</Text>
        <Pressable onPress={() => nav.goBack()} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }}>
          <Text style={{ color: colors.red, fontWeight: "800" }}>Fermer</Text>
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled">
        {rows.slice(0, 2).map((row) => (
          <MenuRow key={row.label} label={row.label} onPress={row.go} />
        ))}
        <MenuRow label="Catégories" onPress={() => setOpen((v) => !v)} hint={open ? "▾" : "▸"} />
        {open
          ? tree.map((cat) => (
              <View key={cat.id}>
                <MenuRow
                  label={cat.name}
                  nested
                  onPress={() => go(() => nav.navigate("Category", { slug: cat.slug, title: cat.name }))}
                />
                {(cat.children || []).map((child) => (
                  <MenuRow
                    key={child.id}
                    label={child.name}
                    nested
                    child
                    onPress={() => go(() => nav.navigate("Category", { slug: child.slug, title: child.name }))}
                  />
                ))}
              </View>
            ))
          : null}
        {rows.slice(2).map((row) => (
          <MenuRow key={row.label} label={row.label} onPress={row.go} />
        ))}
      </ScrollView>
    </View>
  );
}

function MenuRow({ label, onPress, nested, child, hint }: { label: string; onPress: () => void; nested?: boolean; child?: boolean; hint?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.white,
        marginHorizontal: 12,
        marginBottom: 8,
        marginLeft: child ? 28 : 12,
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text style={{ fontWeight: nested ? "600" : "700", color: colors.text, flex: 1 }}>{label}</Text>
      {hint ? <Text style={{ color: colors.muted, fontWeight: "800" }}>{hint}</Text> : null}
    </Pressable>
  );
}
