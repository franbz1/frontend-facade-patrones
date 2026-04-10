import { AuthPageContent } from "@/components/auth-page-content";
import { PublicRoute } from "@/components/route-guards";

export default function LoginPage() {
  return (
    <PublicRoute>
      <AuthPageContent mode="login" />
    </PublicRoute>
  );
}
