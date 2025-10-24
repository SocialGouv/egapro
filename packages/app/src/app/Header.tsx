"use client";

import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export function AppHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const navigationItems = [
    {
      text: "Accueil",
      linkProps: {
        href: "/",
        target: "_self",
      },
      isActive: pathname === "/",
    },
  ];

  // Créer les éléments d'accès rapide en fonction de l'état de connexion
  let quickAccessItems;

  if (status === "authenticated" && session) {
    quickAccessItems = [
      {
        iconId: "fr-icon-logout-box-r-line",
        buttonProps: {
          onClick: () => signOut({ callbackUrl: "/" }),
        },
        text: "Se déconnecter",
      },
    ];
  } else {
    quickAccessItems = [
      {
        iconId: "fr-icon-account-line",
        linkProps: {
          href: "/login",
        },
        text: "Se connecter",
      },
    ];
  }

  return (
    <DsfrHeader
      brandTop={
        <>
          RÉPUBLIQUE
          <br />
          FRANÇAISE
        </>
      }
      homeLinkProps={{
        href: "/",
        title: "Accueil - Egapro",
      }}
      serviceTitle="Egapro"
      serviceTagline="L'égalité professionnelle entre les femmes et les hommes"
      navigation={navigationItems}
      quickAccessItems={quickAccessItems}
    />
  );
}

// Export nommé pour la compatibilité avec les imports existants
export const Header = AppHeader;
