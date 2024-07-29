"use client";

import MonCompteProButton from "@codegouvfr/react-dsfr/MonCompteProButton";
import { Link } from "@design-system";
import { signIn } from "next-auth/react";

export interface MonCompteProLoginProps {
  callbackUrl: string;
}
export const MonCompteProLogin = ({ callbackUrl }: MonCompteProLoginProps) => (
  <>
    <MonCompteProButton
      onClick={e => {
        e.preventDefault();
        signIn("moncomptepro", { redirect: false });
      }}
    />
    <Link href="/aide-moncomptepro" target="_blank">
      Consulter l'aide MonComptePro
    </Link>
  </>
);
