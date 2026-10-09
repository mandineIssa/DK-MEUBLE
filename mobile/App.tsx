import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AccountScreen from "./src/screens/AccountScreen";
import { ContactScreen, OrdersScreen, TrackScreen, WishlistScreen } from "./src/screens/AccountExtraScreens";
import CartScreen from "./src/screens/CartScreen";
import { CatalogScreen, CategoryScreen } from "./src/screens/CatalogScreen";
import CategoriesScreen from "./src/screens/CategoriesScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProductScreen from "./src/screens/ProductScreen";
import SearchScreen, { MenuScreen } from "./src/screens/SearchScreen";
import {
  BrandScreen,
  BrandsScreen,
  InfoScreen,
  QuoteScreen,
  RealizationsScreen,
  ServiceScreen,
  ServicesScreen,
  ShowroomsScreen,
} from "./src/screens/ShopScreens";
import { AppState, useCart } from "./src/store";
import { colors } from "./src/theme";
import type { RootParamList } from "./src/ui";

const Stack = createNativeStackNavigator<RootParamList>();
const Tab = createBottomTabNavigator();

function Tabs() {
  const { cart } = useCart();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 16);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
        tabBarStyle: {
          height: 58 + bottom,
          paddingBottom: bottom,
          paddingTop: 6,
          backgroundColor: colors.black,
          borderTopColor: colors.black,
        },
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === "Accueil"
              ? "home"
              : route.name === "Catégories"
                ? "grid"
                : route.name === "Panier"
                  ? "cart"
                  : "person";
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Catégories" component={CategoriesScreen} />
      <Tab.Screen name="Panier" component={CartScreen} options={{ tabBarBadge: cart.items_count > 0 ? cart.items_count : undefined }} />
      <Tab.Screen name="Compte" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppState>
        <NavigationContainer
          theme={{
            ...DefaultTheme,
            colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.navy },
          }}
        >
          <StatusBar style="dark" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="Product" component={ProductScreen} />
            <Stack.Screen name="Category" component={CategoryScreen} />
            <Stack.Screen name="Catalog" component={CatalogScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="Track" component={TrackScreen} />
            <Stack.Screen name="Contact" component={ContactScreen} />
            <Stack.Screen name="Brands" component={BrandsScreen} />
            <Stack.Screen name="Brand" component={BrandScreen} />
            <Stack.Screen name="Services" component={ServicesScreen} />
            <Stack.Screen name="Service" component={ServiceScreen} />
            <Stack.Screen name="Showrooms" component={ShowroomsScreen} />
            <Stack.Screen name="Realizations" component={RealizationsScreen} />
            <Stack.Screen name="Quote" component={QuoteScreen} />
            <Stack.Screen name="Info" component={InfoScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppState>
    </SafeAreaProvider>
  );
}
