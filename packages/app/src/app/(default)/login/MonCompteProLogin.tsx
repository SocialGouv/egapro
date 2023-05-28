"use client";

import { MonCompteProButton } from "@components/MonComptePro";
import { signIn } from "next-auth/react";

export interface MonCompteProLoginProps {
  callbackUrl: string;
}
export const MonCompteProLogin = ({ callbackUrl }: MonCompteProLoginProps) => (
  <>
    <p>Vous pouvez sinon choisir de vous identifier avec le service "Mon Compte Pro"</p>
    <a
      href="#"
      onClick={e => {
        e.preventDefault();
        signIn("moncomptepro", { callbackUrl });
      }}
    >
      <MonCompteProButton />
    </a>
  </>
);
