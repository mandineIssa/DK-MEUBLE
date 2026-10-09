import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../api";
import { useAuth } from "../store";
import { AppHeader, Field, PrimaryButton, useAppNav } from "../ui";
import { colors } from "../theme";

type Step = "login" | "password" | "register" | "otp" | "forgot" | "reset";

export default function AccountScreen() {
  const { customer, signIn, signOut } = useAuth();
  const nav = useAppNav();
  const [step, setStep] = useState<Step>("login");
  const [login, setLogin] = useState("");
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      Alert.alert("Compte", e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (customer) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AppHeader />
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.navy }}>{customer.name || "Mon compte"}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{customer.email || customer.phone}</Text>
          <View style={{ height: 16 }} />
          <PrimaryButton label="Mes commandes" onPress={() => nav.navigate("Orders")} />
          <View style={{ height: 8 }} />
          <PrimaryButton label="Favoris" onPress={() => nav.navigate("Wishlist")} />
          <View style={{ height: 8 }} />
          <PrimaryButton label="Suivre une commande" onPress={() => nav.navigate("Track")} />
          <View style={{ height: 8 }} />
          <PrimaryButton label="Se déconnecter" onPress={() => signOut()} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.navy, marginBottom: 12 }}>Compte</Text>
        {step === "login" ? (
          <>
            <Field value={login} onChange={setLogin} placeholder="E-mail ou téléphone" />
            <PrimaryButton
              label="Continuer"
              busy={busy}
              onPress={() =>
                run(async () => {
                  const res = await api.identify(login.trim());
                  setChannel(res.channel);
                  setLogin(res.login);
                  setStep(res.exists && res.has_password ? "password" : res.exists ? "otp" : "register");
                  if (res.exists && !res.has_password) await api.requestOtp(res.channel, res.login);
                })
              }
            />
          </>
        ) : null}
        {step === "password" ? (
          <>
            <Field value={password} onChange={setPassword} placeholder="Mot de passe" secure />
            <PrimaryButton
              label="Se connecter"
              busy={busy}
              onPress={() =>
                run(async () => {
                  const res = await api.login(login, password);
                  await signIn(res.token, res.customer);
                })
              }
            />
            <Pressable
              onPress={() =>
                run(async () => {
                  await api.requestOtp(channel, login);
                  setStep("otp");
                })
              }
            >
              <Text style={{ color: colors.navy, marginTop: 12, fontWeight: "700" }}>Recevoir un code à la place</Text>
            </Pressable>
            {channel === "email" ? (
              <Pressable
                onPress={() =>
                  run(async () => {
                    await api.forgot(login);
                    setStep("reset");
                    Alert.alert("E-mail", "Un code a été envoyé si ce compte existe.");
                  })
                }
              >
                <Text style={{ color: colors.red, marginTop: 10, fontWeight: "700" }}>Mot de passe oublié</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
        {step === "register" ? (
          <>
            <Field value={name} onChange={setName} placeholder="Nom complet" />
            <Field value={password} onChange={setPassword} placeholder="Mot de passe" secure />
            <Field value={confirm} onChange={setConfirm} placeholder="Confirmer le mot de passe" secure />
            <PrimaryButton
              label="Créer mon compte"
              busy={busy}
              onPress={() =>
                run(async () => {
                  const res = await api.register({
                    name: name.trim(),
                    password,
                    password_confirmation: confirm,
                    email: channel === "email" ? login : undefined,
                    phone: channel === "phone" ? login : undefined,
                  });
                  await signIn(res.token, res.customer);
                })
              }
            />
          </>
        ) : null}
        {step === "otp" || step === "reset" ? (
          <>
            <Field value={code} onChange={setCode} placeholder="Code à 6 chiffres" keyboard="number-pad" />
            {step === "reset" ? (
              <>
                <Field value={password} onChange={setPassword} placeholder="Nouveau mot de passe" secure />
                <Field value={confirm} onChange={setConfirm} placeholder="Confirmer" secure />
              </>
            ) : null}
            <PrimaryButton
              label={step === "otp" ? "Valider le code" : "Enregistrer le mot de passe"}
              busy={busy}
              onPress={() =>
                run(async () => {
                  if (step === "otp") {
                    const res = await api.verifyOtp(channel, login, code.trim());
                    await signIn(res.token, res.customer);
                  } else {
                    if (password !== confirm) throw new Error("Les deux mots de passe ne correspondent pas.");
                    const res = await api.reset(login, code.trim(), password);
                    if (res.token && res.customer) await signIn(res.token, res.customer);
                    else Alert.alert("Compte", res.message || "Mot de passe mis à jour. Connectez-vous.");
                  }
                })
              }
            />
          </>
        ) : null}
        {step !== "login" ? (
          <Pressable onPress={() => setStep("login")}>
            <Text style={{ marginTop: 16, color: colors.muted }}>Changer d'identifiant</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
