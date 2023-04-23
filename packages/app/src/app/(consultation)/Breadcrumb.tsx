"use client";

import { Breadcrumb as MainBreadcrumb, type BreadcrumbProps } from "@codegouvfr/react-dsfr/Breadcrumb";
import { useSelectedLayoutSegments } from "next/navigation";

interface SegmentMap {
  [K: string]: {
    label: string;
    segments?: SegmentMap;
  };
}

const segmentMap: SegmentMap = {
  "consulter-index": {
    label: "Index Egapro",
    segments: {
      recherche: {
        label: "Rechercher l'index de l'égalité professionnelle d'une entreprise",
      },
    },
  },
  "representation-equilibree": {
    label: "Représentation équilibrée",
    segments: {
      recherche: {
        label: "Rechercher la représentation équilibrée d'une entreprise",
      },
    },
  },
};

type Segments = BreadcrumbProps["segments"];

const defaultSegments: Segments = [
  {
    label: "Accueil",
    linkProps: {
      href: "/",
    },
  },
];

export const Breadcrumb = () => {
  const pathSegments = useSelectedLayoutSegments();
  const segments = defaultSegments.concat(
    pathSegments.reduce(
      ({ currentSegmentMap, segments }, path, currentIndex) => {
        return {
          currentSegmentMap: currentSegmentMap[path]?.segments ?? {},
          segments: [
            ...segments,
            {
              label: currentSegmentMap[path]?.label ?? "Page Actuelle",
              linkProps: {
                href: `/${pathSegments.slice(0, currentIndex + 1).join("/")}`,
              },
            },
          ],
        };
      },
      {
        currentSegmentMap: segmentMap,
        segments: [] as BreadcrumbProps["segments"],
      },
    ).segments,
  );
  const currentPageLabel = segments.pop()?.label;

  return <MainBreadcrumb segments={segments} currentPageLabel={currentPageLabel} />;
};
