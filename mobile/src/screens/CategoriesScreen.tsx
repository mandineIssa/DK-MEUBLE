import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { api, imageUrl, type Category } from "../api";
import { AppHeader, EmptyText, ScreenLoader, useAppNav } from "../ui";
import { colors } from "../theme";

export default function CategoriesScreen() {
  const nav = useAppNav();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .categories()
      .then((res) => setItems(res.tree?.length ? res.tree : res.popular || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ScreenLoader />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <Text style={styles.title}>Catégories</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ gap: 10 }}
        ListEmptyComponent={<EmptyText>Aucune catégorie publiée.</EmptyText>}
        renderItem={({ item }) => {
          const src = imageUrl(item.image_path);
          return (
            <Pressable style={styles.card} onPress={() => nav.navigate("Category", { slug: item.slug, title: item.name })}>
              {src ? <Image source={{ uri: src }} style={styles.img} /> : <View style={styles.img} />}
              <Text style={styles.name}>{item.name}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800", color: colors.navy, paddingHorizontal: 14, paddingBottom: 4 },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
    overflow: "hidden",
  },
  img: { height: 100, backgroundColor: "#F3F4F6" },
  name: { padding: 10, fontWeight: "700", color: colors.text },
});
