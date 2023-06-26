"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header";
import { signOut, useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";

export const UserHeaderItem = () => {
  const session = useSession();

  switch (session.status) {
    case "authenticated":
      return (
        <HeaderQuickAccessItem
          key="hqai-authenticated-user"
          quickAccessItem={{
            iconId: session.data.user.staff ? "fr-icon-github-line" : "fr-icon-account-fill",
            text: `${session.data.user.email}${session.data.user.staff ? " (staff)" : ""}`,
            linkProps: { href: "/index-egapro/tableauDeBord/mon-profil" },
          }}
        />
      );
    case "loading":
      return (
        <HeaderQuickAccessItem
          key="hqai-authloading-fake-user"
          quickAccessItem={{
            iconId: "fr-icon-account-fill",
            text: <Skeleton width={200} highlightColor="var(--text-action-high-blue-france)" />,
            linkProps: {
              href: "#",
              onClick(e) {
                e.preventDefault();
              },
            },
          }}
        />
      );
    default:
      return null;
  }
};

export const LoginLogoutHeaderItem = () => {
  const session = useSession();

  switch (session.status) {
    case "authenticated":
      return (
        <HeaderQuickAccessItem
          key="hqai-authenticated-logout"
          quickAccessItem={{
            iconId: "fr-icon-lock-unlock-line",
            buttonProps: {
              className: fr.cx("fr-btn--secondary"),
              async onClick(e) {
                e.preventDefault();
                await signOut({ callbackUrl: "/" });
              },
            },
            text: "Se déconnecter",
          }}
        />
      );

    case "unauthenticated":
      return (
        <HeaderQuickAccessItem
          key="hqai-unauthenticated-login"
          quickAccessItem={{
            iconId: "fr-icon-lock-line",
            linkProps: {
              href: "/login",
              className: fr.cx("fr-btn--secondary"),
            },
            text: "Se connecter",
          }}
        />
      );
    default: // loading
      return (
        <HeaderQuickAccessItem
          key="hqai-authloading-fake-button"
          quickAccessItem={{
            iconId: "fr-icon-lock-line",
            text: <Skeleton width={110} />,
            buttonProps: {
              className: fr.cx("fr-btn--secondary"),
            },
          }}
        />
      );
  }
};
