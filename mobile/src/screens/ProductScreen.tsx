import { useEffect, useRef, useState } from "react";
import { Dimensions, Image, Linking, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { api, imageUrl, type Product, type Review } from "../api";
import { AppHeader, PrimaryButton, ProductCard, ScreenLoader, useAppNav, type RootParamList } from "../ui";
import { useCart } from "../store";
import { colors, formatFcfa } from "../theme";

export default function ProductScreen() {
  const route = useRoute<RouteProp<RootParamList, "Product">>();
  const nav = useAppNav();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<{ average: number; count: number; reviews: Review[] } | null>(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState(0);
  const [openDesc, setOpenDesc] = useState(true);
  const [openSpecs, setOpenSpecs] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [similar, setSimilar] = useState<Product[]>([]);
  const insets = useSafeAreaInsets();
  const width = Dimensions.get("window").width - 28;
  const galleryRef = useRef<ScrollView>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([api.product(route.params.slug), api.reviews(route.params.slug).catch(() => null)])
      .then(([p, r]) => {
        setProduct(p);
        setReviews(r);
        setPhoto(0);
        if (p.category?.slug) {
          api
            .products({ category: p.category.slug })
            .then((rows) => setSimilar(rows.filter((item) => item.id !== p.id).slice(0, 6)))
            .catch(() => setSimilar([]));
        } else {
          setSimilar([]);
        }
      })
      .catch(() => {
        setProduct(null);
        setError("Impossible de charger ce produit.");
      })
      .finally(() => setLoading(false));
  }, [route.params.slug, reload]);

  if (loading) return <ScreenLoader />;
  if (!product) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader />
        <Text style={{ textAlign: "center", marginTop: 24, color: colors.muted }}>{error || "Produit introuvable."}</Text>
        {error ? (
          <View style={{ padding: 16 }}>
            <PrimaryButton label="Réessayer" onPress={() => setReload((n) => n + 1)} />
          </View>
        ) : null}
      </View>
    );
  }

  const price = product.effective_price ?? product.promo_price ?? product.price;
  const images = product.images || [];
  const soldOut = product.stock_quantity === 0;
  const specs = product.specs && typeof product.specs === "object" ? Object.entries(product.specs).filter(([, value]) => value != null && typeof value !== "object") : [];
  const description = product.description || product.short_description || "";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 + insets.bottom }}>
        <Pressable onPress={() => nav.goBack()} style={styles.back}>
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
        {product.category?.name ? (
          <Text style={styles.crumb} onPress={() => nav.navigate("Category", { slug: product.category!.slug, title: product.category!.name })}>
            {product.category.name}
          </Text>
        ) : null}
        <ScrollView
          ref={galleryRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.gallery}
          onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
            setPhoto(index);
          }}
        >
          {(images.length ? images : [{ id: 0, path: "" }]).map((img) => {
            const src = imageUrl(img.path);
            return (
              <View key={img.id} style={[styles.slide, { width }]}>
                {src ? <Image source={{ uri: src }} style={styles.image} /> : <Text style={styles.meta}>Image indisponible</Text>}
              </View>
            );
          })}
        </ScrollView>
        {images.length > 1 ? <Text style={styles.meta}>{photo + 1} / {images.length}</Text> : null}
        {images.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
            {images.map((img, index) => (
              <Pressable key={img.id} onPress={() => { setPhoto(index); galleryRef.current?.scrollTo({ x: width * index, animated: true }); }} style={[styles.thumb, photo === index && styles.thumbOn]}>
                <Image source={{ uri: imageUrl(img.path) }} style={styles.thumbImg} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        {product.badge_label ? <Text style={styles.badge}>{product.badge_label}</Text> : null}
        <Text style={styles.name}>{product.name}</Text>
        {product.brand?.name ? (
          <Text style={styles.link} onPress={() => nav.navigate("Brand", { slug: product.brand!.slug, title: product.brand!.name })}>
            {product.brand.name}
          </Text>
        ) : null}
        {reviews && reviews.count > 0 ? (
          <Text style={styles.meta}>
            {"★".repeat(Math.round(reviews.average))} {reviews.average.toFixed(1)} ({reviews.count})
          </Text>
        ) : null}
        <Text style={styles.price}>{formatFcfa(price)}</Text>
        {product.stock_quantity === 0 ? <Text style={styles.meta}>Rupture de stock</Text> : product.stock_quantity != null && product.stock_quantity > 0 ? <Text style={styles.meta}>En stock</Text> : null}
        {product.compare_at_price && price != null && product.compare_at_price > price ? (
          <Text style={styles.compare}>{formatFcfa(product.compare_at_price)}</Text>
        ) : null}
        {product.sku ? <Text style={styles.meta}>Réf. {product.sku}</Text> : null}
        {description ? (
          <View style={styles.box}>
            <Text style={styles.blockTitle} onPress={() => setOpenDesc((v) => !v)}>
              {openDesc ? "Description ▾" : "Description ▸"}
            </Text>
            {openDesc ? <Text style={styles.desc}>{description}</Text> : null}
          </View>
        ) : null}
        {specs.length > 0 ? (
          <View style={styles.box}>
            <Text style={styles.blockTitle} onPress={() => setOpenSpecs((v) => !v)}>
              {openSpecs ? "Caractéristiques ▾" : "Caractéristiques ▸"}
            </Text>
            {openSpecs
              ? specs.map(([key, value]) => (
                  <Text key={key} style={styles.spec}>
                    {key} : {String(value)}
                  </Text>
                ))
              : null}
          </View>
        ) : null}
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}
        <Pressable onPress={() => nav.navigate("Quote", { productId: product.id })}>
          <Text style={styles.link}>Demander un devis</Text>
        </Pressable>
        <View style={styles.links}>
          <Text style={styles.link} onPress={() => nav.navigate("Info", { key: "delivery", title: "Livraison" })}>
            Livraison
          </Text>
          <Text style={styles.link} onPress={() => nav.navigate("Services")}>
            Services
          </Text>
          <Text style={styles.link} onPress={() => nav.navigate("Info", { key: "payment", title: "Paiement" })}>
            Paiement
          </Text>
          <Text style={styles.link} onPress={() => nav.navigate("Info", { key: "returns", title: "Retours" })}>
            Retours
          </Text>
        </View>
        <Pressable
          onPress={() => {
            api
              .settings()
              .then((raw) => {
                const contact = (raw.contact || {}) as { whatsapp?: string };
                const num = String(contact.whatsapp || "").replace(/\D/g, "");
                if (!num) return;
                const text = encodeURIComponent(`Bonjour, je souhaite des informations sur ${product.name}.`);
                Linking.openURL(`https://wa.me/${num}?text=${text}`);
              })
              .catch(() => undefined);
          }}
        >
          <Text style={styles.link}>Écrire sur WhatsApp</Text>
        </Pressable>
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
        {similar.length ? (
          <View>
            <Text style={styles.blockTitle}>Produits similaires</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 8 }}>
              {similar.map((item) => (
                <View key={item.id} style={{ width: 180 }}>
                  <ProductCard product={item} wide />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.buyBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.qtyRow}>
          <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))} accessibilityLabel="Diminuer la quantité">
            <Text style={styles.qtyTxt}>−</Text>
          </Pressable>
          <Text style={styles.qty}>{qty}</Text>
          <Pressable style={styles.qtyBtn} onPress={() => setQty((q) => Math.min(99, q + 1))} accessibilityLabel="Augmenter la quantité">
            <Text style={styles.qtyTxt}>+</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={soldOut ? "Rupture de stock" : "Ajouter au panier"}
            onPress={() => {
              if (soldOut) return;
              add(product.id, qty)
                .then(() => setMsg("Ajouté au panier."))
                .catch((e: Error) => setMsg(e.message));
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" },
  backText: { color: colors.navy, fontWeight: "800" },
  crumb: { color: colors.muted, marginBottom: 8 },
  gallery: { height: 240, backgroundColor: colors.white, borderRadius: 12 },
  slide: { height: 240, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  image: { width: "100%", height: "100%", resizeMode: "contain" },
  thumb: { width: 56, height: 56, borderRadius: 8, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  thumbOn: { borderColor: colors.red },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  badge: { alignSelf: "flex-start", marginTop: 10, backgroundColor: colors.red, color: colors.white, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
  name: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 8 },
  meta: { color: colors.muted, marginTop: 4 },
  link: { color: colors.red, fontWeight: "700", marginTop: 10, marginRight: 14 },
  links: { flexDirection: "row", flexWrap: "wrap" },
  price: { color: colors.price, fontSize: 22, fontWeight: "900", marginTop: 8 },
  compare: { color: colors.muted, textDecorationLine: "line-through" },
  desc: { marginTop: 12, color: colors.text, lineHeight: 20 },
  box: { marginTop: 12, backgroundColor: colors.white, borderRadius: 10, padding: 10 },
  spec: { marginBottom: 4, color: colors.text },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  buyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  qtyTxt: { color: colors.white, fontSize: 18, fontWeight: "800" },
  qty: { fontSize: 18, fontWeight: "800", minWidth: 24, textAlign: "center" },
  msg: { marginTop: 10, color: colors.green, fontWeight: "700" },
  blockTitle: { marginTop: 18, fontSize: 18, fontWeight: "800", color: colors.navy },
  review: { backgroundColor: colors.white, borderRadius: 10, padding: 10, marginTop: 8 },
  reviewName: { fontWeight: "700", color: colors.navy },
  reviewTitle: { fontWeight: "700", marginTop: 2 },
});
