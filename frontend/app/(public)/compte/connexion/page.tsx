import { Suspense } from "react";
import LoginForm from "@/components/compte/LoginForm";

export const metadata = {
  title: "Connexion",
  description: "Connexion ou création de compte DK MEUBLE par téléphone.",
};

export default function CompteConnexionPage() {
  return (
    <div className="flex flex-1 flex-col justify-center bg-[#ececec] px-4 py-12 md:py-16">
      <Suspense fallback={<p className="text-center text-sm text-brand-black/50">Chargement…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
