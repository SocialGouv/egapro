"use client";

import { storePicker } from "@common/utils/zustand";
import { Link } from "@design-system";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { redirect } from "next/navigation";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../(funnel)/useRepeqFunnelStore";

const useStore = storePicker(useRepeqFunnelStore);
export const DownloadRepeqPdf = () => {
  const [funnel] = useStore("funnel", "resetFunnel");
  const hydrated = useRepeqFunnelStoreHasHydrated();

  if (!hydrated) {
    return <Skeleton />;
  }

  if (!funnel?.siren || !funnel.year) {
    redirect("/representation-equilibree/commencer");
  }
  return (
    <p>
      <Link
        href={`/representation-equilibree/${funnel.siren}/${funnel.year}/pdf`}
        target="_blank"
        download={`representation_${funnel.siren}_${funnel.year + 1}.pdf`}
        type="application/pdf"
        rel="noopener noreferer"
      >
        Télécharger le récapitulatif de la déclaration
      </Link>
    </p>
  );
};
