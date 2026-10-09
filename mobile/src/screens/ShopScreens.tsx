import { useEffect, useState } from "react";
import { FlatList, Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { api, imageUrl, type Product } from "../api";
import {
  AppHeader,
  EmptyText,
  Field,
  PrimaryButton,
  ProductCard,
  ScreenLoader,
  useAppNav,
  type RootParamList,
} from "../ui";
import { colors } from "../theme";

function Title({ children }: { children: string }) {
  return <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, paddingHorizontal: 14, paddingBottom: 8 }}>{children}</Text>;
}

function CardText({ children, onPress }: { children: string; onPress?: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={{ backgroundColor: colors.white, marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 10, fontWeight: "700", color: colors.text }}
    >
      {children}
    </Text>
  );
}

export function BrandsScreen() {
  const nav = useAppNav();
  const [rows, setRows] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.brands().then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <ScreenLoader />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Title>Marques</Title>
      <ScrollView>
        {rows.length === 0 ? <EmptyText>Aucune marque pour le moment.</EmptyText> : null}
        {rows.map((row) => (
          <CardText key={row.id} onPress={() => nav.navigate("Brand", { slug: row.slug, title: row.name })}>
            {row.name}
          </CardText>
        ))}
      </ScrollView>
    </View>
  );
}

export function BrandScreen() {
  const route = useRoute<RouteProp<RootParamList, "Brand">>();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.brand(route.params.slug).then((res) => setItems(res.products || [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, [route.params.slug]);

  if (loading) return <ScreenLoader />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Title>{route.params.title}</Title>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={items.length ? { justifyContent: "space-between" } : undefined}
        ListEmptyComponent={<EmptyText>Aucun produit pour cette marque.</EmptyText>}
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}

export function ServicesScreen() {
  const nav = useAppNav();
  const [title, setTitle] = useState("Services");
  const [intro, setIntro] = useState("");
  const [rows, setRows] = useState<Array<{ id: number; title: string; slug: string; short_description?: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .services()
      .then((res) => {
        setRows(res.services || []);
        setTitle(res.settings?.intro_title || "Services");
        setIntro(res.settings?.intro_text || "");
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ScreenLoader />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <ScrollView>
        <Title>{title}</Title>
        {intro ? <Text style={{ color: colors.muted, paddingHorizontal: 14, marginBottom: 10 }}>{intro}</Text> : null}
        {rows.length === 0 ? <EmptyText>Aucun service pour le moment.</EmptyText> : null}
        {rows.map((row) => (
          <Pressable key={row.id} onPress={() => nav.navigate("Service", { slug: row.slug, title: row.title })} style={{ backgroundColor: colors.white, marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 10 }}>
            <Text style={{ fontWeight: "800", color: colors.text }}>{row.title}</Text>
            {row.short_description ? <Text style={{ color: colors.muted, marginTop: 4 }}>{row.short_description}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function ServiceScreen() {
  const route = useRoute<RouteProp<RootParamList, "Service">>();
  const [body, setBody] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .service(route.params.slug)
      .then((res) => {
        const raw = res.service.full_content || res.service.short_description || "";
        setBody(raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
        setEnabled(res.settings?.request_form_enabled !== false);
      })
      .catch(() => setBody(""))
      .finally(() => setLoading(false));
  }, [route.params.slug]);

  if (loading) return <ScreenLoader />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>{route.params.title}</Text>
        {body ? <Text style={{ marginTop: 10, color: colors.text, lineHeight: 20 }}>{body}</Text> : null}
        {enabled ? (
          <View style={{ marginTop: 18 }}>
            <Text style={{ fontWeight: "800", color: colors.text, marginBottom: 8 }}>Demander ce service</Text>
            <Field value={name} onChange={setName} placeholder="Nom" />
            <Field value={phone} onChange={setPhone} placeholder="Téléphone" keyboard="phone-pad" />
            <Field value={email} onChange={setEmail} placeholder="E-mail (facultatif)" keyboard="email-address" />
            <Field value={message} onChange={setMessage} placeholder="Votre message" />
            <PrimaryButton
              label="Envoyer"
              busy={busy}
              onPress={() => {
                if (!name.trim() || !phone.trim() || !message.trim()) {
                  setStatus("Indiquez votre nom, votre téléphone et votre message.");
                  return;
                }
                setBusy(true);
                api
                  .serviceRequest(route.params.slug, {
                    customer_name: name.trim(),
                    phone: phone.trim(),
                    email: email.trim() || undefined,
                    message: message.trim(),
                  })
                  .then((res) => setStatus(res.message || "Demande envoyée."))
                  .catch((e: Error) => setStatus(e.message))
                  .finally(() => setBusy(false));
              }}
            />
            {status ? <Text style={{ marginTop: 10, color: colors.text }}>{status}</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

export function ShowroomsScreen() {
  const [rows, setRows] = useState<Array<{ id: number; name: string; address: string; city?: string | null; phone?: string | null; opening_hours?: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.showroomList().then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <ScreenLoader />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Title>Showrooms</Title>
      <ScrollView>
        {rows.length === 0 ? <EmptyText>Aucun showroom publié.</EmptyText> : null}
        {rows.map((row) => (
          <View key={row.id} style={{ backgroundColor: colors.white, marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 10 }}>
            <Text style={{ fontWeight: "800", color: colors.text }}>{row.name}</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{[row.address, row.city].filter(Boolean).join(", ")}</Text>
            {row.opening_hours ? <Text style={{ color: colors.text, marginTop: 4 }}>{row.opening_hours}</Text> : null}
            {row.phone ? (
              <Text style={{ color: colors.red, fontWeight: "700", marginTop: 6 }} onPress={() => Linking.openURL(`tel:${row.phone}`)}>
                {row.phone}
              </Text>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function RealizationsScreen() {
  const [rows, setRows] = useState<Array<{ id: number; title: string; description: string | null; image_url: string; tag: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.realizations().then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <ScreenLoader />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Title>Réalisations</Title>
      <ScrollView>
        {rows.length === 0 ? <EmptyText>Aucune réalisation publiée.</EmptyText> : null}
        {rows.map((row) => (
          <View key={row.id} style={{ backgroundColor: colors.white, marginHorizontal: 12, marginBottom: 10, borderRadius: 10, overflow: "hidden" }}>
            {row.image_url ? <Image source={{ uri: imageUrl(row.image_url) }} style={{ height: 160, width: "100%" }} /> : null}
            <View style={{ padding: 12 }}>
              {row.tag ? <Text style={{ color: colors.red, fontWeight: "700", fontSize: 12 }}>{row.tag}</Text> : null}
              <Text style={{ fontWeight: "800", color: colors.text, marginTop: 4 }}>{row.title}</Text>
              {row.description ? <Text style={{ color: colors.muted, marginTop: 4 }}>{row.description}</Text> : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const QUOTE_TYPES = ["Frigo", "Salon", "Armoire", "Bureau", "TV", "Autre"];

export function QuoteScreen() {
  const route = useRoute<RouteProp<RootParamList, "Quote">>();
  const [type, setType] = useState("Frigo");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>Demander un devis</Text>
        <Text style={{ color: colors.muted, marginTop: 6, marginBottom: 12 }}>
          Hôtels, bureaux, écoles et commerces. Le tarif est confirmé après étude de la demande.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {QUOTE_TYPES.map((label) => (
            <Text
              key={label}
              onPress={() => setType(label)}
              style={{
                backgroundColor: type === label ? colors.red : colors.white,
                color: type === label ? colors.white : colors.text,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                overflow: "hidden",
                fontWeight: "700",
              }}
            >
              {label}
            </Text>
          ))}
        </View>
        <Field value={name} onChange={setName} placeholder="Nom" />
        <Field value={phone} onChange={setPhone} placeholder="Téléphone" keyboard="phone-pad" />
        <Field value={email} onChange={setEmail} placeholder="E-mail (facultatif)" keyboard="email-address" />
        <Field value={company} onChange={setCompany} placeholder="Entreprise (facultatif)" />
        <Field value={message} onChange={setMessage} placeholder="Décrivez votre besoin" />
        <PrimaryButton
          label="Envoyer le devis"
          busy={busy}
          onPress={() => {
            if (!name.trim() || !phone.trim() || !message.trim()) {
              setStatus("Indiquez votre nom, votre téléphone et votre message.");
              return;
            }
            const raw = phone.trim();
            const formatted = raw.startsWith("+") ? raw : `+221${raw.replace(/\s/g, "")}`;
            setBusy(true);
            api
              .quote({
                product_id: route.params?.productId,
                name: name.trim(),
                phone: formatted,
                email: email.trim() || undefined,
                company_name: company.trim() || undefined,
                message: `[Type: ${type}] ${message.trim()}`,
              })
              .then((res) => setStatus(res.message || "Demande envoyée."))
              .catch((e: Error) => setStatus(e.message))
              .finally(() => setBusy(false));
          }}
        />
        {status ? <Text style={{ marginTop: 10, color: colors.text }}>{status}</Text> : null}
      </ScrollView>
    </View>
  );
}

function textFromBlocks(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    const text = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 1 && !/^https?:/i.test(text)) out.push(text);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => textFromBlocks(item, out));
    return out;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => textFromBlocks(item, out));
  }
  return out;
}

export function InfoScreen() {
  const route = useRoute<RouteProp<RootParamList, "Info">>();
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .page(route.params.key)
      .then((page) => setLines(textFromBlocks(page.blocks)))
      .catch(() => setLines([]))
      .finally(() => setLoading(false));
  }, [route.params.key]);

  if (loading) return <ScreenLoader />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 10 }}>{route.params.title}</Text>
        {lines.length === 0 ? <EmptyText>Cette page n’a pas encore de texte publié.</EmptyText> : null}
        {lines.map((line) => (
          <Text key={line} style={{ color: colors.text, marginBottom: 8, lineHeight: 20 }}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
