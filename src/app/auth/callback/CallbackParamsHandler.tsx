"use client";

import { useSearchParams } from "next/navigation";
import WrapperClient from "./WrapperClient";

export default function CallbackParamsHandler() {
  const searchParams = useSearchParams();

  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");

  return (
    <WrapperClient
      errorParam={errorParam}
      errorDescription={errorDescription}
      code={code}
    />
  );
}

