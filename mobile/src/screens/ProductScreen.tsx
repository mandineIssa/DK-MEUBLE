import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { api, imageUrl, type Product, type Review } from "../api";
import { AppHeader, PrimaryButton, ScreenLoader, type RootParamList } from "../ui";
import { useCart } from "../store";
import { colors, formatFcfa } from "../theme";

export default function ProductScreen() {
  const route = useRoute<RouteProp<RootParamList, "Product">>();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<{ average: number; count: number; reviews: Review[] } | null>(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.product(route.params.slug), api.reviews(route.params.slug).catch(() => null)])
      .then(([p, r]) => {
        setProduct(p);
        setReviews(r);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [route.params.slug]);

  if (loading) return <ScreenLoader />;
  if (!product) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader />
        <Text style={{ textAlign: "center", marginTop: 24, color: colors.muted }}>Produit introuvable.</Text>
      </View>
    );
  }

  const price = product.effective_price ?? product.promo_price ?? product.price;
  const cover = imageUrl(product.images?.[0]?.path);
  const soldOut = product.stock_quantity === 0;
  const specs = product.specs && typeof product.specs === "object" ? Object.entries(product.specs) : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 28 }}>
        <View style={styles.gallery}>{cover ? <Image source={{ uri: cover }} style={styles.image} /> : null}</View>
        {product.badge_label ? <Text style={styles.badge}>{product.badge_label}</Text> : null}
        <Text style={styles.name}>{product.name}</Text>
        {product.brand?.name ? <Text style={styles.meta}>{product.brand.name}</Text> : null}
        {reviews && reviews.count > 0 ? (
          <Text style={styles.meta}>
            {"★".repeat(Math.round(reviews.average))} {reviews.average.toFixed(1)} ({reviews.count})
          </Text>
        ) : null}
        <Text style={styles.price}>{formatFcfa(price)}</Text>
        {product.compare_at_price && price != null && product.compare_at_price > price ? (
          <Text style={styles.compare}>{formatFcfa(product.compare_at_price)}</Text>
        ) : null}
        {product.sku ? <Text style={styles.meta}>Réf. {product.sku}</Text> : null}
        <Text style={styles.desc}>{product.short_description || product.description || ""}</Text>
        {specs.length > 0 ? (
          <View style={styles.box}>
            {specs.map(([key, value]) =>
              value == null || typeof value === "object" ? null : (
                <Text key={key} style={styles.spec}>
                  {key} : {String(value)}
                </Text>
              )
            )}
          </View>
        ) : null}
        <View style={styles.qtyRow}>
          <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
            <Text style={styles.qtyTxt}>−</Text>
          </Pressable>
          <Text style={styles.qty}>{qty}</Text>
          <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => Math.min(99, q + 1))}>
            <Text style={styles.qtyTxt}>+</Text>
          </Pressable>
        </View>
        <PrimaryButton
          label={soldOut ? "Rupture de stock" : "Ajouter au panier"}
          onPress={() => {
            if (soldOut) return;
            add(product.id, qty)
              .then(() => setMsg("Ajouté au panier."))
              .catch((e: Error) => setMsg(e.message));
          }}
        />
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}
        {reviews?.reviews?.length ? (
          <View>
            <Text style={styles.blockTitle}>Avis</Text>
            {reviews.reviews.map((r) => (
              <View key={r.id} style={styles.review}>
                <Text style={styles.reviewName}>
                  {r.author_name} · {"★".repeat(r.rating)}
                </Text>
                {r.title ? <Text style={styles.reviewTitle}>{r.title}</Text> : null}
                <Text>{r.body}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { height: 240, backgroundColor: colors.white, borderRadius: 12, overflow: "hidden" },
  image: { width: "100%", height: "100%", resizeMode: "contain" },
  badge: { alignSelf: "flex-start", marginTop: 10, backgroundColor: colors.red, color: colors.white, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
  name: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 8 },
  meta: { color: colors.muted, marginTop: 4 },
  price: { color: colors.price, fontSize: 22, fontWeight: "900", marginTop: 8 },
  compare: { color: colors.muted, textDecorationLine: "line-through" },
  desc: { marginTop: 12, color: colors.text, lineHeight: 20 },
  box: { marginTop: 12, backgroundColor: colors.white, borderRadius: 10, padding: 10 },
  spec: { marginBottom: 4, color: colors.text },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  qtyBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  qtyTxt: { color: colors.white, fontSize: 18, fontWeight: "800" },
  qty: { fontSize: 18, fontWeight: "800", minWidth: 24, textAlign: "center" },
  msg: { marginTop: 10, color: colors.green, fontWeight: "700" },
  blockTitle: { marginTop: 18, fontSize: 18, fontWeight: "800", color: colors.navy },
  review: { backgroundColor: colors.white, borderRadius: 10, padding: 10, marginTop: 8 },
  reviewName: { fontWeight: "700", color: colors.navy },
  reviewTitle: { fontWeight: "700", marginTop: 2 },
});
