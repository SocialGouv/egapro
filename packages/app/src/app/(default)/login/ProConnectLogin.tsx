"use client";

import { signIn } from "next-auth/react";

export interface ProConnectLoginProps {
  callbackUrl: string;
}
export const ProConnectLogin = ({ callbackUrl }: ProConnectLoginProps) => (
  <div className="fr-connect-group">
    <button
      onClick={e => {
        e.preventDefault();
        signIn("moncomptepro", { redirect: false });
      }}
      className="fr-connect"
    >
      <span className="fr-connect__login">S’identifier avec</span> <span className="fr-connect__brand">ProConnect</span>
    </button>
  </div>
);
