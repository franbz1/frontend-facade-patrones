import { AuthPageContent } from "@/components/auth-page-content";
import { PublicRoute } from "@/components/route-guards";

export default function RegisterPage() {
  return (
    <PublicRoute>
      <AuthPageContent mode="register" />
    </PublicRoute>
  );
}
