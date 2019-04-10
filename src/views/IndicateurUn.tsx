/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import React from "react";

import useField from "../hooks/useField";
import FieldGroup from "../components/FieldGroup";

function displayPercent(num: number): string {
  return (num * 100).toFixed(2) + "%";
}

enum TranchesAges {
  MoinsDe30ans = "MoinsDe30ans",
  De30a39ans = "De30a39ans",
  De40a49ans = "De40a49ans",
  PlusDe50ans = "PlusDe50ans"
}

enum CategorieSocioPro {
  Ouvriers = "Ouvriers",
  Employes = "Employes",
  Techniciens = "Techniciens",
  Cadres = "Cadres"
}

interface Groupe {
  trancheAge: TranchesAges;
  categorieSocioPro: CategorieSocioPro;
  nombreSalariesFemmes: number | undefined;
  nombreSalariesHommes: number | undefined;
  remunerationAnnuelleBrutFemmes: number | undefined;
  remunerationAnnuelleBrutHommes: number | undefined;
}

const appState: Array<Groupe> = [
  {
    trancheAge: TranchesAges.MoinsDe30ans,
    categorieSocioPro: CategorieSocioPro.Ouvriers,
    nombreSalariesFemmes: undefined,
    nombreSalariesHommes: undefined,
    remunerationAnnuelleBrutFemmes: undefined,
    remunerationAnnuelleBrutHommes: undefined
  }
];

const sp = 5 / 100;

function IndicateurUn() {
  const nbSalarieFemmeField = useField("nombreSalariesFemmes");
  const nbSalarieHommeField = useField("nombreSalariesHommes");

  const remuFemmeField = useField("remunerationAnnuelleBrutFemmes");
  const remuHommeField = useField("remunerationAnnuelleBrutHommes");

  const vg =
    nbSalarieFemmeField.meta.valueNumber >= 3 &&
    nbSalarieHommeField.meta.valueNumber >= 3;

  const ev =
    nbSalarieFemmeField.meta.valueNumber + nbSalarieHommeField.meta.valueNumber;

  const erm =
    (remuHommeField.meta.valueNumber - remuFemmeField.meta.valueNumber) /
    remuHommeField.meta.valueNumber;
  const esp = Math.sign(erm) * Math.max(0, Math.abs(erm) - sp);

  const tev = ev;

  const ep = (esp * ev) / tev;

  return (
    <div>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>Employés - 30 à 39 ans</p>

        <FieldGroup
          label="Nombre de salariés femmes"
          field={nbSalarieFemmeField}
        />

        <FieldGroup
          label="Nombre de salariés hommes"
          field={nbSalarieHommeField}
        />

        {nbSalarieFemmeField.meta.touched && nbSalarieHommeField.meta.touched && (
          <React.Fragment>
            <div css={styles.message}>
              {vg ? (
                <p>Effectif valide de {ev} personnes</p>
              ) : (
                <p>
                  Groupe invalide car il ne contient pas suffisament de
                  personnes (au moins 3 femmes et 3 hommes)
                </p>
              )}
            </div>
            {vg && (
              <React.Fragment>
                <FieldGroup
                  label="Rénumération annuelle brute moyenne femmes"
                  field={remuFemmeField}
                />
                <FieldGroup
                  label="Rénumération annuelle brute moyenne hommes"
                  field={remuHommeField}
                />

                {remuFemmeField.meta.touched && remuHommeField.meta.touched && (
                  <div css={styles.message}>
                    {remuFemmeField.meta.valueNumber > 0 &&
                    remuHommeField.meta.valueNumber > 0 ? (
                      <React.Fragment>
                        <p>
                          Écart de rémunération moyenne {displayPercent(erm)}
                        </p>
                        <p>
                          Écart après application du seuil de pertinence{" "}
                          {displayPercent(esp)}
                        </p>
                        <p>Écart pondéré {displayPercent(ep)}</p>
                      </React.Fragment>
                    ) : (
                      <p>Veuillez renseigner les rénumérations moyennes</p>
                    )}
                  </div>
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

const styles = {
  bloc: css({
    display: "flex",
    flexDirection: "column",
    maxWidth: 800,
    padding: "12px 24px",
    margin: "24px auto",
    backgroundColor: "white",
    borderRadius: 6,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)"
  }),
  blocTitle: css({
    fontSize: 24,
    paddingTop: 6,
    paddingBottom: 24,
    color: "#353535"
  }),
  fieldGroup: css({
    display: "flex",
    flexDirection: "column",
    marginBottom: 24
  }),
  fieldLabel: css({
    marginBottom: 6
  }),
  fieldInput: css({
    fontSize: 20,
    padding: "2px 6px"
  }),
  message: css({
    fontSize: 26,
    fontWeight: 200,
    textAlign: "center",
    marginBottom: 32,
    marginTop: 12
  })
};

export default IndicateurUn;
