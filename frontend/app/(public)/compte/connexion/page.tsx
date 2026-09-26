import LoginForm from "@/components/compte/LoginForm";

export const metadata = {
  title: "Connexion",
  description:
    "Connexion ou création de compte DK HOMETECH par téléphone, Google ou Facebook.",
};

export default function CompteConnexionPage() {
  return (
    <div className="flex flex-1 flex-col justify-center bg-[#ececec] px-4 py-12 md:py-16">
      <LoginForm />
    </div>
  );
}
