import { Suspense } from "react";
import LoginPageContent from "./LoginPageContent";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading login...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
