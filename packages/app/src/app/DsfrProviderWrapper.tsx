"use client";

import { DsfrProviderBase } from "@codegouvfr/react-dsfr/next-app-router";
import Link from "next/link";

interface DsfrProviderWrapperProps {
  children: React.ReactNode;
  lang: string;
  defaultColorScheme: any;
}

export function DsfrProviderWrapper({ children, lang, defaultColorScheme }: DsfrProviderWrapperProps) {
  return (
    <DsfrProviderBase lang={lang} defaultColorScheme={defaultColorScheme} Link={Link}>
      {children}
    </DsfrProviderBase>
  );
}