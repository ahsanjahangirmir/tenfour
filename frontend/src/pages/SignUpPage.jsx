import { SignUp } from "@clerk/clerk-react";
import AuthShell from "./auth/AuthShell";
import { clerkAppearance } from "./auth/clerkAppearance";

export default function SignUpPage() {
  return (
    <AuthShell eyebrow="Hours-of-service trip planning">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}
