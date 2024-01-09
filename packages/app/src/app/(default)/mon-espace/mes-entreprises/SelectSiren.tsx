"use client";

import { fr } from "@codegouvfr/react-dsfr";
import SelectNext from "@codegouvfr/react-dsfr/SelectNext";
import { Grid, GridCol } from "@design-system";
import { getCompany } from "@globalActions/company";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const SelectSiren = ({ sirenList }: { sirenList: string[] }) => {
  const router = useRouter();
  const [currentSiren, setCurrentSiren] = useState<string>("");
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("");

  useEffect(() => {
    if (currentSiren !== "") {
      getCompany(currentSiren).then(company => {
        if (company.ok) setSelectedCompanyName(company?.data?.simpleLabel ?? "");
      });
      router.push(`/mon-espace/mes-entreprises?siren=${currentSiren}`);
    }
  }, [currentSiren, router]);

  return (
    <Grid>
      <GridCol sm={3}>
        <SelectNext
          label="SIREN"
          nativeSelectProps={{ onChange: event => setCurrentSiren(event.target.value) }}
          options={sirenList.map(value => ({
            value,
            label: value,
            selected: value === currentSiren,
          }))}
        />
      </GridCol>
      <GridCol sm={9}>
        <div className={fr.cx("fr-pt-10v", "fr-pl-2v")}>
          <span className={fr.cx("fr-icon-building-line", "fr-pr-2v")} aria-hidden="true"></span>
          <span>{selectedCompanyName}</span>
        </div>
      </GridCol>
    </Grid>
  );
};
