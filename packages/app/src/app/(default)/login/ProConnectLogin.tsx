"use client";

import ProConnectButton from "@codegouvfr/react-dsfr/MonCompteProButton";
import { signIn } from "next-auth/react";

export interface ProConnectLoginProps {
  callbackUrl: string;
}
export const ProConnectLogin = ({ callbackUrl }: ProConnectLoginProps) => (
  <ProConnectButton
    onClick={e => {
      e.preventDefault();
      signIn("moncomptepro", { redirect: false });
    }}
  />
);
