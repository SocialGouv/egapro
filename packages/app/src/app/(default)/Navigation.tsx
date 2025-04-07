"use client";

import { MainNavigation, type MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from "next/navigation";
import { useSession } from "next-auth/react";

import { adminMenuItems } from "../admin/Navigation";

export const Navigation = () => {
  const segment = useSelectedLayoutSegment();
  const segments = useSelectedLayoutSegments() || [];

  const { data: session } = useSession();

  const isStaff = session?.user.staff || session?.staff.impersonating || false;

  return (
    <MainNavigation
      items={[
        {
          text: "Accueil",
          linkProps: {
            href: "/",
          },
          isActive: !segment,
        },
        {
          text: "Index",
          isActive: segment === "index-egapro",
          buttonProps: {
            id: "main-navigation-index-link",
          },
          menuLinks: [
            {
              text: "À propos de l'index",
              linkProps: {
                href: "/index-egapro",
              },
              isActive: segments.includes("index-egapro") && segments.length === 1,
            },
            {
              text: "Calculer mon index",
              linkProps: {
                href: "/index-egapro/simulateur/commencer",
                id: "main-navigation-calculate-index-link",
              },
              isActive: segments.includes("simulateur") && segments.includes("index-egapro"),
            },
            {
              text: "Déclarer mon index",
              linkProps: {
                href: "/index-egapro/declaration/assujetti",
              },
              isActive: segments.includes("declaration") && segments.includes("index-egapro"),
            },
            {
              text: "Consulter l'index",
              linkProps: {
                href: "/index-egapro/recherche",
                target: "_blank",
              },
              isActive: segments.includes("recherche") && segments.includes("index-egapro"),
            },
          ],
        },
        {
          text: "Représentation équilibrée",
          isActive: segment === "representation-equilibree",
          buttonProps: {
            id: "main-navigation-index-link",
          },
          menuLinks: [
            {
              text: "À propos des écarts",
              linkProps: {
                href: "/representation-equilibree",
              },
              isActive: segments.includes("representation-equilibree") && segments.length === 1,
            },
            {
              text: "Déclarer les écarts",
              linkProps: {
                href: "/representation-equilibree/assujetti",
              },
              isActive: segments.includes("assujetti") && segments.includes("representation-equilibree"),
            },
            {
              text: "Consulter les écarts",
              linkProps: {
                href: "/representation-equilibree/recherche",
                target: "_blank",
              },
              isActive: segments.includes("recherche") && segments.includes("representation-equilibree"),
            },
          ],
        },
        ...(isStaff
          ? [
              {
                text: "Admin",
                menuLinks: adminMenuItems.map(item => ({
                  text: item.text,
                  linkProps: {
                    href: item.href,
                  },
                })),
              } satisfies MainNavigationProps["items"][number],
            ]
          : []),
      ]}
    />
  );
};
