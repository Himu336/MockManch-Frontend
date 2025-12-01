"use client";

import dynamic from "next/dynamic";

const CallbackClient = dynamic(() => import("./CallbackClient"), {
  ssr: false,
});

export default function WrapperClient({
  errorParam,
  errorDescription,
  code,
}: {
  errorParam: string | null;
  errorDescription: string | null;
  code: string | null;
}) {
  return (
    <CallbackClient
      errorParam={errorParam}
      errorDescription={errorDescription}
      code={code}
    />
  );
}

