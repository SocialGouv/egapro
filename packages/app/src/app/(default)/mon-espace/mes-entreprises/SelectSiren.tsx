"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Grid, GridCol } from "@design-system";
import { getCompany } from "@globalActions/company";
import { useEffect, useState } from "react";

export const SelectSiren = ({ sirenList, loadedSiren }: { loadedSiren?: string; sirenList: string[] }) => {
  const activeSiren = loadedSiren ?? sirenList[0] ?? "";
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    if (activeSiren) {
      getCompany(activeSiren).then(company => {
        if (company.ok) setCompanyName(company?.data?.simpleLabel ?? "");
      });
    }
  }, [activeSiren]);

  if (!activeSiren) return null;

  return (
    <Grid>
      <GridCol sm={3}>
        <p className={fr.cx("fr-text--bold", "fr-mb-0")}>Numéro Siren de l'entreprise</p>
        <p className={fr.cx("fr-mb-0")}>{activeSiren}</p>
      </GridCol>
      <GridCol sm={6}>
        <div className={fr.cx("fr-pt-3v", "fr-pl-2v")}>
          <span className={fr.cx("fr-icon-building-line", "fr-pr-2v")} aria-hidden="true"></span>
          <span>{companyName}</span>
        </div>
      </GridCol>
    </Grid>
  );
};
