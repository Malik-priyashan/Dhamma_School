"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import RulesReader from "./RulesReader";

export default function RulesAndRegulationsPage() {
  const locale = useLocale();
  const router = useRouter();

  return <RulesReader onBack={() => router.push(`/${locale}/join-us`)} />;
}
