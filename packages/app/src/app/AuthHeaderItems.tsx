"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header";
import { ConfigContext } from "@components/utils/ConfigProvider";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { useSession } from "next-auth/react";
import { useContext } from "react";

import { HeaderAccountMenu } from "./HeaderAccountMenu";

export const UserHeaderItem = () => {
  const session = useSession();
  const config = useContext(ConfigContext);

  let isStaff = false;
  switch (session.status) {
    case "authenticated":
      isStaff = session.data.user.staff || session.data.staff.impersonating || false;
      return (
        <HeaderAccountMenu
          staff={isStaff}
          session={session}
          isEmailLogin={config.isEmailLogin}
          isProConnectTest={config.isProConnectTest}
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
              onClick(e) {
                e.preventDefault();
                // RP-initiated logout: our route clears the local session and
                // redirects to the ProConnect end_session_endpoint so the IdP
                // session is terminated too. Without it the next login is
                // silently re-authenticated on the previous organization.
                window.location.href = "/api/auth/logout";
              },
            },
            text: "Se déconnecter",
          }}
        />
      );

    default: // loading
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
  }
};
