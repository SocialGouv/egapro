"use client";

import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from "next/navigation";

export const Navigation = () => {
  const segment = useSelectedLayoutSegment();
  const segments = useSelectedLayoutSegments();

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
          isActive: segment === "index-egapro_",
          menuLinks: [
            {
              text: "À propos de l'index",
              linkProps: {
                href: "/index-egapro_",
              },
              isActive: segments.includes("index-egapro_") && segments.length === 1,
            },
            {
              text: "Calculer mon index",
              linkProps: {
                href: "/index-egapro_/simulateur/commencer",
              },
              isActive: segments.includes("simulateur") && segments.includes("index-egapro_"),
            },
            {
              text: "Déclarer mon index",
              linkProps: {
                href: "/index-egapro_/declaration/commencer",
              },
              isActive: segments.includes("declaration") && segments.includes("index-egapro_"),
            },
          ],
        },
        {
          text: "Représentation équilibrée",
          linkProps: {
            href: "/representation-equilibree",
          },
          isActive: segment === "representation-equilibree",
        },
      ]}
    />
  );
};
