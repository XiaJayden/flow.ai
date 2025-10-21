import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export default async function HomePage() {
  // Use robust authentication check
  const user = await getAuthenticatedUser(false);
  
  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/auth/signin");
  }
}