import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../api";
import { useCart } from "../store";
import { AppHeader, Field, PrimaryButton } from "../ui";
import { colors, formatFcfa } from "../theme";

export default function CheckoutScreen() {
  const { cart, refresh } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<"domicile" | "retrait_showroom">("domicile");
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [showroomId, setShowroomId] = useState<number | null>(null);
  const [pay, setPay] = useState("");
  const [zones, setZones] = useState<Array<{ id: number; zone_name: string; delivery_fee: number }>>([]);
  const [showrooms, setShowrooms] = useState<Array<{ id: number; name: string }>>([]);
  const [pays, setPays] = useState<Array<{ key: string; label: string }>>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.zones().then(setZones).catch(() => setZones([]));
    api.showrooms().then((rows) => setShowrooms(rows.map((s) => ({ id: s.id, name: s.name })))).catch(() => setShowrooms([]));
    api
      .checkoutOptions()
      .then((opt) => {
        const enabled = (opt.payment_methods || []).filter((p) => p.enabled);
        setPays(enabled);
        if (enabled[0]) setPay(enabled[0].key);
      })
      .catch(() => setPays([]));
  }, []);

  async function submit() {
    if (!cart.items.length) {
      Alert.alert("Commande", "Votre panier est vide.");
      return;
    }
    setBusy(true);
    try {
      const order = await api.checkout({
        customer_name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
        delivery_method: method,
        delivery_zone_id: method === "domicile" ? zoneId : null,
        showroom_id: method === "retrait_showroom" ? showroomId : null,
        payment_method: pay,
        customer_note: note.trim() || null,
      });
      await refresh();
      Alert.alert("Commande enregistrée", order.reference ? `Référence ${order.reference}` : "Votre commande est enregistrée.");
    } catch (e) {
      Alert.alert("Commande", e instanceof Error ? e.message : "Commande impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 32 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.navy, marginBottom: 8 }}>
          Commander · {formatFcfa(cart.subtotal)}
        </Text>
        <Field value={name} onChange={setName} placeholder="Nom complet" />
        <Field value={phone} onChange={setPhone} placeholder="Téléphone" keyboard="phone-pad" />
        <Field value={email} onChange={setEmail} placeholder="E-mail (facultatif)" keyboard="email-address" />
        <Field value={address} onChange={setAddress} placeholder="Adresse de livraison" />
        <Text style={{ fontWeight: "700", marginBottom: 6, color: colors.navy }}>Livraison</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          <Choice label="À domicile" on={method === "domicile"} onPress={() => setMethod("domicile")} />
          <Choice label="Retrait magasin" on={method === "retrait_showroom"} onPress={() => setMethod("retrait_showroom")} />
        </View>
        {method === "domicile"
          ? zones.map((z) => (
              <Choice key={z.id} label={`${z.zone_name} · ${formatFcfa(z.delivery_fee)}`} on={zoneId === z.id} onPress={() => setZoneId(z.id)} />
            ))
          : showrooms.map((s) => <Choice key={s.id} label={s.name} on={showroomId === s.id} onPress={() => setShowroomId(s.id)} />)}
        <Text style={{ fontWeight: "700", marginVertical: 6, color: colors.navy }}>Paiement</Text>
        {pays.map((p) => (
          <Choice key={p.key} label={p.label} on={pay === p.key} onPress={() => setPay(p.key)} />
        ))}
        <Field value={note} onChange={setNote} placeholder="Note (facultatif)" />
        <PrimaryButton label="Valider la commande" onPress={submit} busy={busy} />
      </ScrollView>
    </View>
  );
}

function Choice({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: on ? colors.navy : colors.line,
        backgroundColor: on ? "#E8EEF8" : colors.white,
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontWeight: "700", color: colors.navy }}>{label}</Text>
    </Pressable>
  );
}
