import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api, imageUrl, type Category, type Product } from "../api";
import { useAppNav, AppHeader, EmptyText, ProductCard, ScreenLoader, SearchBar, SectionHead, SubNav } from "../ui";
import { colors } from "../theme";

const WHY = [
  { title: "Produits de qualité", icon: "✓" },
  { title: "Meilleurs prix", icon: "%" },
  { title: "Service client à l'écoute", icon: "☎" },
  { title: "Livraison partout au Sénégal", icon: "🚚" },
];

export default function HomeScreen() {
  const nav = useAppNav();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [hero, setHero] = useState<{ title: string; subtitle: string; image: string }>({
    title: "Meubles & Électroménager",
    subtitle: "Qualité, confort et meilleurs prix à Dakar",
    image: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [cats, home, popular] = await Promise.all([
          api.categories().catch(() => ({ tree: [], popular: [] })),
          api.homepage().catch(() => ({} as Record<string, unknown>)),
          api.products({ per_page: "8" }).catch(() => []),
        ]);
        const popularCats = cats.popular?.length ? cats.popular : cats.tree || [];
        setCategories(popularCats.slice(0, 8));
        const sections = Array.isArray(home["sections"]) ? (home["sections"] as Array<Record<string, unknown>>) : [];
        const slideSection = sections.find((s) => Array.isArray(s.slides) && (s.slides as unknown[]).length);
        const slide = (slideSection?.slides as Array<Record<string, string | null>> | undefined)?.[0];
        if (slide) {
          setHero({
            title: slide.title || "Meubles & Électroménager",
            subtitle: slide.subtitle || "Qualité, confort et meilleurs prix à Dakar",
            image: imageUrl(slide.image_mobile || slide.image_desktop),
          });
        }
        const fromHome = sections.flatMap((s) => (Array.isArray(s.products) ? (s.products as Product[]) : []));
        setProducts((fromHome.length ? fromHome : popular).slice(0, 8));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ScreenLoader />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={() => query.trim() && nav.navigate("Search", { q: query.trim() })}
        />
        <SubNav active="home" />
        <View style={styles.hero}>
          {hero.image ? <Image source={{ uri: hero.image }} style={StyleSheet.absoluteFill} /> : null}
          <View style={styles.heroShade} />
          <Text style={styles.heroTitle}>{hero.title}</Text>
          <Text style={styles.heroSub}>{hero.subtitle}</Text>
          <Pressable style={styles.cta} onPress={() => nav.navigate("Catalog", { mode: "new", title: "Nouveautés" })}>
            <Text style={styles.ctaText}>Découvrir nos produits →</Text>
          </Pressable>
        </View>

        <SectionHead title="Catégories" onSeeAll={() => nav.navigate("Tabs", { screen: "Catégories" })} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {categories.map((c) => {
            const src = imageUrl(c.image_path);
            return (
              <Pressable key={c.id} style={styles.cat} onPress={() => nav.navigate("Category", { slug: c.slug, title: c.name })}>
                {src ? <Image source={{ uri: src }} style={styles.catImg} /> : <View style={styles.catImg} />}
                <Text numberOfLines={2} style={styles.catName}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionHead title="Produits populaires" onSeeAll={() => nav.navigate("Catalog", { mode: "new", title: "Nouveautés" })} />
        {products.length === 0 ? <EmptyText>Aucun produit publié pour le moment.</EmptyText> : null}
        <View style={styles.grid}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </View>

        <Text style={styles.whyTitle}>Pourquoi DK HOMETECH ?</Text>
        <View style={styles.whyCard}>
          {WHY.map((item) => (
            <View key={item.title} style={styles.whyItem}>
              <View style={styles.whyIcon}>
                <Text style={styles.whyGlyph}>{item.icon}</Text>
              </View>
              <Text style={styles.whyLabel}>{item.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerRed} />
          <View style={styles.bannerCut} />
          <MaterialCommunityIcons name="truck-fast" size={26} color="#fff" style={styles.bannerTruck} />
          <Text style={styles.bannerText} numberOfLines={1}>
            Livraison partout au Sénégal
          </Text>
          <View style={styles.flag}>
            <View style={styles.flagGreen} />
            <View style={styles.flagYellow}>
              <Text style={styles.flagStar}>★</Text>
            </View>
            <View style={styles.flagRed} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { margin: 12, borderRadius: 14, minHeight: 180, overflow: "hidden", backgroundColor: "#16325C", padding: 16, justifyContent: "flex-end" },
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(8,30,74,0.45)" },
  heroTitle: { color: colors.white, fontSize: 26, fontWeight: "900" },
  heroSub: { color: colors.white, marginTop: 4, marginBottom: 12 },
  cta: { alignSelf: "flex-start", backgroundColor: colors.red, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  ctaText: { color: colors.white, fontWeight: "800" },
  catRow: { paddingHorizontal: 12, gap: 10 },
  cat: { width: 110, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  catImg: { height: 78, backgroundColor: "#F3F4F6" },
  catName: { padding: 8, fontSize: 12, fontWeight: "700", color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 12 },
  whyTitle: { marginTop: 8, marginHorizontal: 14, fontSize: 18, fontWeight: "800", color: colors.navy },
  whyCard: {
    margin: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    paddingVertical: 14,
  },
  whyItem: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  whyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  whyGlyph: { color: colors.white, fontWeight: "800" },
  whyLabel: { marginTop: 6, textAlign: "center", fontSize: 11, color: colors.navy, fontWeight: "700" },
  banner: {
    marginTop: 4,
    marginBottom: 16,
    height: 44,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B4F9C",
  },
  bannerRed: {
    position: "absolute",
    left: -20,
    top: -12,
    bottom: -12,
    width: "40%",
    backgroundColor: "#E10600",
    transform: [{ skewX: "-22deg" }],
  },
  bannerCut: {
    position: "absolute",
    left: "30%",
    top: -20,
    bottom: -20,
    width: 16,
    backgroundColor: "#ffffff",
    transform: [{ skewX: "-22deg" }],
  },
  bannerTruck: { marginLeft: 14, zIndex: 1 },
  bannerText: {
    flex: 1,
    color: colors.white,
    fontWeight: "900",
    fontSize: 15,
    textAlign: "center",
    marginLeft: 18,
    zIndex: 1,
  },
  flag: {
    width: 36,
    height: 24,
    marginRight: 14,
    flexDirection: "row",
    overflow: "hidden",
    zIndex: 1,
  },
  flagGreen: { flex: 1, backgroundColor: "#00853F" },
  flagYellow: { flex: 1, backgroundColor: "#FDEF42", alignItems: "center", justifyContent: "center" },
  flagRed: { flex: 1, backgroundColor: "#E31B23" },
  flagStar: { color: "#00853F", fontSize: 9, lineHeight: 11, fontWeight: "900" },
});
