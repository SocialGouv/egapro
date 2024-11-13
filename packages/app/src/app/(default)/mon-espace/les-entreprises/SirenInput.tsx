"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { Grid, GridCol } from "@design-system";
import { getCompany } from "@globalActions/company";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const SirenInput = ({ loadedSiren }: { loadedSiren?: string }) => {
  const router = useRouter();
  const [currentSiren, setCurrentSiren] = useState<string>(loadedSiren ? loadedSiren : "");
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("");
  const [disabled, setDisabled] = useState<boolean>(false);

  useEffect(() => {
    try {
      const sirenVO = new Siren(currentSiren);
      setDisabled(true);
      getCompany(sirenVO.getValue()).then(company => {
        setDisabled(false);
        if (company.ok) setSelectedCompanyName(company?.data?.simpleLabel ?? "");
      });

      if (loadedSiren != currentSiren) {
        router.push(`/mon-espace/les-entreprises?siren=${currentSiren}`);
      }
    } catch (e) {
      return;
    }
  }, [currentSiren, router, loadedSiren]);

  return (
    <Grid>
      <GridCol sm={3}>
        <Input
          label="Numéro Siren de l'entreprise"
          disabled={disabled}
          nativeInputProps={{ onChange: event => setCurrentSiren(event.target.value), value: currentSiren }}
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
