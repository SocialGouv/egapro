"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { signOut, useSession } from "next-auth/react";

export const UserHeaderItem = () => {
  const session = useSession();

  let isStaff = false;
  switch (session.status) {
    case "authenticated":
      isStaff =
        session.data.user?.staff || session.data.staff?.impersonating || false;
      return (
        <HeaderQuickAccessItem
          quickAccessItem={{
            iconId: "fr-icon-account-fill",
            linkProps: {
              href: "/mon-espace",
              className: fr.cx("fr-btn--tertiary"),
            },
            text: "mon espace",
          }}
        />
      );
    case "loading":
      return (
        <HeaderQuickAccessItem
          key="hqai-authloading-fake-user"
          quickAccessItem={{
            iconId: "fr-icon-account-fill",
            text: (
              <Skeleton
                width={200}
                highlightColor="var(--text-action-high-blue-france)"
              />
            ),
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
  const { status } = useSession();

  if (status === "authenticated") {
    return (
      <HeaderQuickAccessItem
        quickAccessItem={{
          iconId: "fr-icon-lock-unlock-line",
          buttonProps: {
            className: fr.cx("fr-btn--secondary", "fr-btn--tertiary"),
            onClick: () => signOut({ callbackUrl: "/" }), // ← juste ça
          },
          text: "Se déconnecter",
        }}
      />
    );
  }

  return (
    <HeaderQuickAccessItem
      quickAccessItem={{
        iconId: "fr-icon-lock-line",
        linkProps: {
          href: "/login",
          className: fr.cx("fr-btn--tertiary"),
        },
        text: "Se connecter",
      }}
    />
  );
};
