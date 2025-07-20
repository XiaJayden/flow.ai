import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/signup-form";

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUpForm />
    </div>
  );
}