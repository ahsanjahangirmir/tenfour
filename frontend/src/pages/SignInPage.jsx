import { SignIn } from "@clerk/clerk-react";
import AuthShell from "./auth/AuthShell";
import { clerkAppearance } from "./auth/clerkAppearance";

export default function SignInPage() {
  return (
    <AuthShell eyebrow="Welcome back">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}
