"use client";

import { Notice } from "@codegouvfr/react-dsfr/Notice";
import { useSession } from "next-auth/react";

import { Box } from "../design-system/base/Box";
import style from "./root.module.scss";

export const ImpersonateNotice = () => {
  const session = useSession();

  if (session.status !== "authenticated") return null;

  const isImpersonating = session.data.staff.impersonating || false;

  if (!isImpersonating) return null;

  const { siren, label } = session.data.user.companies[0];

  return (
    <>
      <Notice
        className={style["impersonate-notice"]}
        title={`Vous êtes actuellement dans la peau du Siren "${siren}" (${label}). Pour arrêter, rendez-vous sur la page d'admin.`}
      />
      <Box mt="7w" />
    </>
  );
};
