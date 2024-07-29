"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Grid, GridCol, Icon } from "@design-system";
import { getCompany } from "@globalActions/company";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export const SelectSiren = ({ sirenList, loadedSiren }: { loadedSiren?: string; sirenList: string[] }) => {
  const router = useRouter();
  const [currentSiren, setCurrentSiren] = useState<string>(loadedSiren ? loadedSiren : "");
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("");

  useEffect(() => {
    if (currentSiren !== "") {
      getCompany(currentSiren).then(company => {
        if (company.ok) setSelectedCompanyName(company?.data?.simpleLabel ?? "");
      });
      if (loadedSiren != currentSiren) router.push(`/mon-espace/mes-entreprises?siren=${currentSiren}`);
    }
  }, [currentSiren, router, loadedSiren]);

  return (
    <>
      <Grid>
        <GridCol sm={3}>
          <Select
            label="SIREN"
            nativeSelectProps={{ onChange: event => setCurrentSiren(event.target.value), value: currentSiren }}
          >
            <option value="">Sélectionner un siren</option>
            {sirenList.map((value, key) => (
              <option key={`siren-${key}`} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </GridCol>
        <GridCol sm={6}>
          <div className={fr.cx("fr-pt-10v", "fr-pl-2v")}>
            <span className={fr.cx("fr-icon-building-line", "fr-pr-2v")} aria-hidden="true"></span>
            <span>{selectedCompanyName}</span>
          </div>
        </GridCol>
      </Grid>
      <div className={fr.cx("fr-pt-3v")}>
        Vous ne trouvez pas dans la liste déroulante l'entreprise rattachée à votre compte MonComptePro, cliquez sur ce
        bouton : <br />
        <Button
          onClick={e => {
            e.preventDefault();
            window.sessionStorage.setItem("redirectUrl", window.location.href);
            signIn("moncomptepro", { redirect: false });
          }}
        >
          <Icon icon="fr-icon-refresh-line" />
          Rafraichir MCP
        </Button>
      </div>
    </>
  );
};
