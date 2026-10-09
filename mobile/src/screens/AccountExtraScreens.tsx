import { useEffect, useState } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";
import { api, type Product } from "../api";
import { useAuth } from "../store";
import { AppHeader, EmptyText, Field, PrimaryButton, ProductCard, ScreenLoader, useAppNav } from "../ui";
import { colors, formatFcfa } from "../theme";

export function WishlistScreen() {
  const { customer } = useAuth();
  const nav = useAppNav();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) {
      setLoading(false);
      return;
    }
    api
      .wishlist()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [customer]);

  if (!customer) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AppHeader />
        <EmptyText>Connectez-vous pour voir vos favoris.</EmptyText>
        <View style={{ padding: 16 }}>
          <PrimaryButton label="Se connecter" onPress={() => nav.navigate("Tabs", { screen: "Compte" })} />
        </View>
      </View>
    );
  }
  if (loading) return <ScreenLoader />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.navy, paddingHorizontal: 14 }}>Favoris</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={items.length ? { justifyContent: "space-between" } : undefined}
        ListEmptyComponent={<EmptyText>Aucun favori pour le moment.</EmptyText>}
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}

export function OrdersScreen() {
  const { customer } = useAuth();
  const [orders, setOrders] = useState<Array<{ id: number; reference: string; total: number; order_status: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) {
      setLoading(false);
      return;
    }
    api
      .orders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [customer]);

  if (!customer) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader />
        <EmptyText>Connectez-vous pour voir vos commandes.</EmptyText>
      </View>
    );
  }
  if (loading) return <ScreenLoader />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<EmptyText>Aucune commande.</EmptyText>}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.white, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <Text style={{ fontWeight: "800", color: colors.navy }}>{item.reference}</Text>
            <Text style={{ marginTop: 4 }}>{formatFcfa(item.total)}</Text>
            <Text style={{ color: colors.muted }}>{item.order_status}</Text>
          </View>
        )}
      />
    </View>
  );
}

export function TrackScreen() {
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.navy, marginBottom: 10 }}>Suivre une commande</Text>
        <Field value={reference} onChange={setReference} placeholder="Référence" />
        <Field value={phone} onChange={setPhone} placeholder="Téléphone de la commande" keyboard="phone-pad" />
        <PrimaryButton
          label="Rechercher"
          onPress={() => {
            setError("");
            api
              .order(reference.trim(), phone.trim())
              .then(setOrder)
              .catch((e: Error) => {
                setOrder(null);
                setError(e.message);
              });
          }}
        />
        {error ? <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text> : null}
        {order ? (
          <View style={{ marginTop: 16, backgroundColor: colors.white, borderRadius: 10, padding: 12 }}>
            <Text style={{ fontWeight: "800" }}>{String(order.reference || "")}</Text>
            <Text style={{ marginTop: 4 }}>Statut : {String(order.order_status || "")}</Text>
            <Text>Total : {formatFcfa(Number(order.total))}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

export function ContactScreen() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    api
      .settings()
      .then((settings) => {
        const contact = (settings.contact || {}) as Record<string, string>;
        const next = [
          contact.address ? `Adresse : ${contact.address}` : "",
          contact.phone_display ? `Téléphone : ${contact.phone_display}` : "",
          contact.phones ? contact.phones : "",
          contact.email ? `E-mail : ${contact.email}` : "",
          contact.hours ? `Horaires : ${contact.hours}` : "",
        ].filter(Boolean);
        setLines(next);
      })
      .catch(() => setLines([]));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.navy, marginBottom: 10 }}>Contact</Text>
        {lines.length === 0 ? <EmptyText>Coordonnées indisponibles pour le moment.</EmptyText> : null}
        {lines.map((line) => (
          <Text key={line} style={{ backgroundColor: colors.white, borderRadius: 10, padding: 12, marginBottom: 8, color: colors.text }}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
