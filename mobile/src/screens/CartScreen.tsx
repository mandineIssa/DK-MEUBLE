import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { imageUrl } from "../api";
import { useCart } from "../store";
import { AppHeader, EmptyText, PrimaryButton, useAppNav } from "../ui";
import { colors, formatFcfa } from "../theme";

export default function CartScreen() {
  const { cart, update, remove } = useCart();
  const nav = useAppNav();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Text style={styles.title}>Panier</Text>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => String(item.product_id)}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <View>
            <EmptyText>Votre panier est vide.</EmptyText>
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <PrimaryButton label="Voir les produits" onPress={() => nav.navigate("Catalog", { mode: "all", title: "Produits" })} />
            </View>
          </View>
        }
        ListFooterComponent={
          cart.items.length ? (
            <View>
              <Text style={styles.total}>Total : {formatFcfa(cart.subtotal)}</Text>
              <PrimaryButton label="Commander" onPress={() => nav.navigate("Checkout")} />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const src = imageUrl(item.image);
          return (
            <View style={styles.row}>
              {src ? <Image source={{ uri: src }} style={styles.img} /> : <View style={styles.img} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>{formatFcfa(item.unit_price)}</Text>
                <Text style={styles.price}>Sous-total : {formatFcfa(item.subtotal)}</Text>
                <View style={styles.qtyRow}>
                  <Pressable style={styles.qty} onPress={() => update(item.product_id, Math.max(1, item.quantity - 1)).catch((e: Error) => Alert.alert("Panier", e.message))}>
                    <Text style={styles.qtyTxt}>−</Text>
                  </Pressable>
                  <Text>{item.quantity}</Text>
                  <Pressable style={styles.qty} onPress={() => update(item.product_id, item.quantity + 1).catch((e: Error) => Alert.alert("Panier", e.message))}>
                    <Text style={styles.qtyTxt}>+</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(item.product_id).catch((e: Error) => Alert.alert("Panier", e.message))}>
                    <Text style={styles.remove}>Retirer</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800", color: colors.navy, paddingHorizontal: 14 },
  row: { flexDirection: "row", gap: 10, backgroundColor: colors.white, borderRadius: 12, padding: 10, marginBottom: 10 },
  img: { width: 72, height: 72, borderRadius: 8, backgroundColor: "#F3F4F6" },
  name: { fontWeight: "700", color: colors.text },
  price: { color: colors.price, fontWeight: "800", marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  qty: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  qtyTxt: { color: colors.white, fontWeight: "800" },
  remove: { color: colors.red, fontWeight: "700" },
  total: { fontSize: 18, fontWeight: "900", color: colors.navy, marginVertical: 8 },
});
