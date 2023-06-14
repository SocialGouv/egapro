import Alert from "@codegouvfr/react-dsfr/Alert";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { AlternativeTable, AlternativeTableCell, AlternativeTableRow, Link } from "@design-system";

import { RowStaffingTable } from "./RowStaffingTable";

export const EffectifsForm = () => {
  return (
    <form noValidate>
      <RadioButtons
        legend="Tranche d'effectifs assujettis de l'entreprise ou de l'unité économique et sociale (UES)"
        options={[
          {
            label: "De 50 à 250 inclus",
            nativeInputProps: {},
          },
          {
            label: "De 251 à 999 inclus",
            nativeInputProps: {},
          },
          {
            label: "De 1000 à plus",
            nativeInputProps: {},
          },
        ]}
      />
      <Alert
        small
        severity="info"
        description={
          <>
            Pour la tranche d'effectifs assujettis, l’entreprise ou l’unité économique et sociale (UES) doit définir son
            assujettissement chaque année à la date de l’obligation de publication de l’index, soit le 1er mars. Le
            calcul des effectifs assujettis de l’entreprise ou de l’unité économique et sociale (UES) est celui prévu
            aux articles{" "}
            <Link
              href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006900783/2008-05-01#:~:text=2%C2%B0%20Les%20salari%C3%A9s%20titulaires,l'entreprise%20%C3%A0%20due%20proportion"
              target="_blank"
            >
              L.1111-2
            </Link>{" "}
            et{" "}
            <Link
              href="https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000006177833/#:~:text=3%C2%B0%20Les%20salari%C3%A9s%20%C3%A0,la%20dur%C3%A9e%20conventionnelle%20du%20travail."
              target="_blank"
            >
              L.1111-3
            </Link>{" "}
            du code du travail.
          </>
        }
      />

      <AlternativeTable
        classeName="fr-mt-2w"
        header={
          <>
            <AlternativeTableRow>
              <AlternativeTableCell as="th" scope="col" rowSpan={2}>
                Catégorie socioprofessionnelle
              </AlternativeTableCell>
              <AlternativeTableCell as="th" scope="col" rowSpan={2} align="center">
                Tranche d’âge
              </AlternativeTableCell>
              <AlternativeTableCell as="th" scope="col" colSpan={2} align="center">
                Nombre de salariés
              </AlternativeTableCell>
            </AlternativeTableRow>
            <AlternativeTableRow>
              <AlternativeTableCell as="th" align="center">
                Femmes
              </AlternativeTableCell>
              <AlternativeTableCell as="th" align="center">
                Hommes
              </AlternativeTableCell>
            </AlternativeTableRow>
          </>
        }
        body={[
          <RowStaffingTable key={1} category="Ouvriers" />,
          <RowStaffingTable key={2} category="Employés" />,
          <RowStaffingTable key={3} category="Techniciens et agents de maîtrise" />,
          <RowStaffingTable key={4} category="Ingénieurs et cadres" />,
        ]}
        footer={
          <>
            <AlternativeTableRow>
              <AlternativeTableCell as="th" scope="row" colSpan={2} rowSpan={2} align="center">
                Ensemble des salariés
              </AlternativeTableCell>

              <AlternativeTableCell align="center">
                Femmes <br />
                <strong>-</strong>
              </AlternativeTableCell>
              <AlternativeTableCell align="center">
                Hommes <br />
                <strong>-</strong>
              </AlternativeTableCell>
            </AlternativeTableRow>
            <AlternativeTableRow>
              <AlternativeTableCell colSpan={2} align="center">
                Salariés <br />
                <strong>-</strong>
              </AlternativeTableCell>
            </AlternativeTableRow>
          </>
        }
      />
    </form>
  );
};
