"use client";

import MonCompteProButton from "@codegouvfr/react-dsfr/MonCompteProButton";
import { signIn } from "next-auth/react";

export interface MonCompteProLoginProps {
  callbackUrl: string;
}
export const MonCompteProLogin = ({ callbackUrl }: MonCompteProLoginProps) => (
  <MonCompteProButton
    onClick={e => {
      e.preventDefault();
      signIn("moncomptepro", { callbackUrl });
    }}
  />
);
