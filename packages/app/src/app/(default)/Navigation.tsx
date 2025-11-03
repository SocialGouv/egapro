"use client";

import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from "next/navigation";

export const Navigation = () => {
  const segment = useSelectedLayoutSegment();
  const segments = useSelectedLayoutSegments() || [];

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
      ]}
    />
  );
};
