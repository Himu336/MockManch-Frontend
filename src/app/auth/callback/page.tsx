import { Suspense } from "react";
import WrapperClient from "./WrapperClient";
import CallbackParamsHandler from "./CallbackParamsHandler";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-black p-4">
        <div className="p-8 max-w-md w-full">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <h2 className="text-2xl font-bold text-white">Loading...</h2>
          </div>
        </div>
      </div>
    }>
      <CallbackParamsHandler />
    </Suspense>
  );
}

