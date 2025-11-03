"use client";

import { StartDsfrOnHydration } from "@codegouvfr/react-dsfr/next-app-router";
import type Link from "next/link";

declare module "@codegouvfr/react-dsfr/next-app-router" {
  interface RegisterLink {
    Link: typeof Link;
  }
}

export function StartDsfr() {
  return <StartDsfrOnHydration />;
}
