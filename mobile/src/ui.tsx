import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { imageUrl, type Product } from "./api";
import { useAuth, useCart } from "./store";
import { colors, formatFcfa } from "./theme";

export type RootParamList = {
  Tabs: { screen?: "Accueil" | "Catégories" | "Recherche" | "Favoris" | "Compte" } | undefined;
  Cart: undefined;
  Product: { slug: string };
  Category: { slug: string; title: string };
  Catalog: { mode: "promo" | "new" | "all" | "clearance" | "refurbished"; title: string };
  Search: { q?: string } | undefined;
  Checkout: undefined;
  Menu: undefined;
  Wishlist: undefined;
  Orders: undefined;
  Track: undefined;
  Contact: undefined;
  Brands: undefined;
  Brand: { slug: string; title: string };
  Services: undefined;
  Service: { slug: string; title: string };
  Showrooms: undefined;
  Realizations: undefined;
  Quote: { productId?: number } | undefined;
  Info: { key: string; title: string };
};

export function useAppNav() {
  return useNavigation<NativeStackNavigationProp<RootParamList>>();
}

export function ScreenLoader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.navy} />
    </View>
  );
}

export function EmptyText({ children }: { children: string }) {
  return <Text style={styles.empty}>{children}</Text>;
}

export function AppHeader({ onSearch }: { onSearch?: () => void }) {
  const insets = useSafeAreaInsets();
  const nav = useAppNav();
  const { cart } = useCart();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <View style={styles.brandRow}>
        <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="DK HOMETECH" />
        <Pressable onPress={onSearch || (() => nav.navigate("Tabs", { screen: "Recherche" }))} style={styles.iconBtn} accessibilityLabel="Rechercher">
          <Ionicons name="search" size={22} color={colors.navy} />
        </Pressable>
        <Pressable onPress={() => nav.navigate("Tabs", { screen: "Favoris" })} style={styles.iconBtn} accessibilityLabel="Favoris">
          <Ionicons name="heart-outline" size={22} color={colors.navy} />
        </Pressable>
        <Pressable onPress={() => nav.navigate("Cart")} style={styles.iconBtn} accessibilityLabel="Panier">
          <Ionicons name="cart-outline" size={24} color={colors.navy} />
          {cart.items_count > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cart.items_count}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable onPress={() => nav.navigate("Menu")} style={styles.iconBtn} accessibilityLabel="Ouvrir le menu">
          <Ionicons name="menu" size={26} color={colors.navy} />
        </Pressable>
      </View>
    </View>
  );
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder="Que recherchez-vous ?"
        placeholderTextColor="#9AA0A8"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.searchInput}
      />
      {value ? (
        <Pressable onPress={() => onChange("")} accessibilityLabel="Effacer la recherche" hitSlop={8}>
          <Ionicons name="close-circle" size={20} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const SUB = [
  { key: "home", label: "Accueil", icon: "home" as const },
  { key: "cats", label: "Catégories", icon: "grid" as const },
  { key: "promo", label: "Promotions", icon: "pricetag" as const },
  { key: "new", label: "Nouveautés", icon: "star" as const },
];

export function SubNav({ active }: { active: "home" | "cats" | "promo" | "new" }) {
  const nav = useAppNav();
  return (
    <View style={styles.sub}>
      {SUB.map((item) => {
        const on = item.key === active;
        return (
          <Pressable
            key={item.key}
            style={styles.subItem}
            onPress={() => {
              if (item.key === "home") nav.navigate("Tabs", { screen: "Accueil" });
              if (item.key === "cats") nav.navigate("Tabs", { screen: "Catégories" });
              if (item.key === "promo") nav.navigate("Catalog", { mode: "promo", title: "Promotions" });
              if (item.key === "new") nav.navigate("Catalog", { mode: "new", title: "Nouveautés" });
            }}
          >
            <Ionicons name={item.icon} size={16} color={on ? colors.red : colors.text} />
            <Text style={[styles.subLabel, on && styles.subOn]}>{item.label}</Text>
            {on ? <View style={styles.subLine} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionHead({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll}>
          <Text style={styles.seeAll}>Voir tout →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProductCard({ product, wide }: { product: Product; wide?: boolean }) {
  const nav = useAppNav();
  const { add } = useCart();
  const { customer, wishlistIds, toggleWish } = useAuth();
  const [broken, setBroken] = useState(false);
  const cover = imageUrl(product.images?.[0]?.path);
  const price = product.effective_price ?? product.promo_price ?? product.price;
  const compare = product.compare_at_price;
  const off = product.discount_percent && product.discount_percent > 0 ? Math.round(product.discount_percent) : null;
  const wished = wishlistIds.includes(product.id);
  const soldOut = product.stock_quantity === 0;

  return (
    <Pressable style={[styles.card, wide && styles.cardWide]} onPress={() => nav.navigate("Product", { slug: product.slug })}>
      <View style={styles.cardImageWrap}>
        {cover && !broken ? (
          <Image source={{ uri: cover }} style={styles.cardImage} onError={() => setBroken(true)} />
        ) : (
          <View style={[styles.cardImage, { alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ color: colors.muted, fontSize: 11 }}>Image indisponible</Text>
          </View>
        )}
        {off ? (
          <View style={styles.off}>
            <Text style={styles.offText}>-{off}%</Text>
          </View>
        ) : null}
        <Pressable
          style={styles.heart}
          onPress={() => {
            if (!customer) {
              nav.navigate("Tabs", { screen: "Compte" });
              return;
            }
            toggleWish(product).catch(() => undefined);
          }}
        >
          <Ionicons name={wished ? "heart" : "heart-outline"} size={18} color={wished ? colors.red : colors.navy} />
        </Pressable>
      </View>
      <Text numberOfLines={2} style={styles.cardName}>
        {product.name}
      </Text>
      {product.brand?.name ? <Text style={styles.brandName}>{product.brand.name}</Text> : null}
      <Text style={styles.cardPrice}>{formatFcfa(price)}</Text>
      {compare && price != null && compare > price ? <Text style={styles.compare}>{formatFcfa(compare)}</Text> : null}
      <Pressable
        style={[styles.addBtn, soldOut && styles.addOff]}
        disabled={soldOut}
        onPress={() => add(product.id).catch(() => undefined)}
      >
        <Ionicons name="cart" size={14} color={colors.white} />
        <Text style={styles.addText}>{soldOut ? "Rupture" : "Ajouter au panier"}</Text>
      </Pressable>
    </Pressable>
  );
}

export function Field({
  value,
  onChange,
  placeholder,
  secure,
  keyboard,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboard?: "default" | "email-address" | "phone-pad" | "number-pad";
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#9AA0A8"
      secureTextEntry={secure}
      keyboardType={keyboard}
      autoCapitalize="none"
      style={styles.field}
    />
  );
}

export function PrimaryButton({ label, onPress, busy }: { label: string; onPress: () => void; busy?: boolean }) {
  return (
    <Pressable style={styles.primary} onPress={onPress} disabled={busy}>
      {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  empty: { textAlign: "center", color: colors.muted, marginTop: 24, paddingHorizontal: 24 },
  header: { backgroundColor: colors.white, paddingHorizontal: 12, paddingBottom: 8 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { height: 44, flex: 1 },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", position: "relative" },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  searchWrap: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: 48,
    gap: 8,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 8 },
  sub: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  subItem: { flex: 1, alignItems: "center", gap: 2 },
  subLabel: { color: colors.text, fontSize: 11, fontWeight: "600" },
  subOn: { color: colors.red, fontWeight: "800" },
  subLine: { height: 3, width: 28, backgroundColor: colors.red, borderRadius: 2, marginTop: 2 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.navy },
  seeAll: { color: colors.red, fontWeight: "700", fontSize: 13 },
  card: {
    width: "48%",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 8,
    marginBottom: 10,
  },
  cardWide: { width: "100%" },
  cardImageWrap: { height: 120, borderRadius: 8, backgroundColor: "#F3F4F6", overflow: "hidden" },
  cardImage: { width: "100%", height: "100%", resizeMode: "contain" },
  off: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: colors.red,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  offText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  heart: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { marginTop: 8, fontWeight: "700", color: colors.text, minHeight: 36 },
  brandName: { color: colors.muted, fontSize: 12 },
  cardPrice: { color: colors.price, fontWeight: "900", fontSize: 15, marginTop: 4 },
  compare: { color: colors.muted, textDecorationLine: "line-through", fontSize: 12 },
  addBtn: {
    marginTop: 8,
    backgroundColor: colors.red,
    borderRadius: 8,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addOff: { backgroundColor: "#9AA0A8" },
  addText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  field: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 10,
    color: colors.text,
    fontSize: 16,
  },
  primary: {
    backgroundColor: colors.red,
    borderRadius: 10,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryText: { color: colors.white, fontWeight: "800", fontSize: 15 },
});
