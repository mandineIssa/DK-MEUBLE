import OtpForm from "@/components/compte/OtpForm";

export const metadata = {
  title: "Vérification",
  description: "Saisie du code OTP DK MEUBLE.",
};

export default function CompteVerificationPage() {
  return (
    <div className="flex flex-1 flex-col justify-center bg-[#ececec] px-4 py-12 md:py-16">
      <OtpForm />
    </div>
  );
}
