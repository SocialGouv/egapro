"use client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { AlternativeTable, CenteredContainer, Link } from "@design-system";

export const EffectifsForm = () => {
  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
  };
  return (
    <form noValidate onSubmit={handleSubmit}>
      <CenteredContainer>
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
              Pour la tranche d'effectifs assujettis, l’entreprise ou l’unité économique et sociale (UES) doit définir
              son assujettissement chaque année à la date de l’obligation de publication de l’index, soit le 1er mars.
              Le calcul des effectifs assujettis de l’entreprise ou de l’unité économique et sociale (UES) est celui
              prévu aux articles{" "}
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
          header={[
            {
              label: "Catégorie socioprofessionnelle",
              informations:
                "Les caractéristiques individuelles (CSP, âge) sont appréciées au dernier jour de la période de référence ou au dernier jour de présence du salarié dans l’entreprise.",
            },
            {
              label: "Tranche d’âge",
              informations:
                "Les caractéristiques individuelles (CSP, âge) sont appréciées au dernier jour de la période de référence ou au dernier jour de présence du salarié dans l’entreprise.",
            },
            {
              label: "Nombre de salariés",
              subCols: [
                {
                  label: "Femmes",
                },
                {
                  label: "Hommes",
                },
              ],
            },
          ]}
          body={[
            {
              categoryLabel: "Ouvriers",
              isDeletable: true,
              subRows: [
                {
                  label: "Moins de 30 ans",
                  cols: [
                    {
                      nativeInputProps: {},
                      label: "Moins de 30 ans, ouvriers, femmes",
                      state: "error",
                      stateRelatedMessage: "Erreur",
                    },
                    {
                      nativeInputProps: {},
                      label: "Moins de 30 ans, ouvriers, hommes",
                    },
                  ],
                },
                {
                  label: "De 30 à 39 ans",
                  cols: [
                    "-",
                    {
                      nativeInputProps: {},
                      label: "30 39, ouvriers, hommes",
                    },
                  ],
                },
                {
                  label: "De 40 à 49 ans",
                  cols: ["-", "-"],
                },
                {
                  label: "50 ans et plus",
                  cols: ["-", "-"],
                },
              ],
            },
            {
              categoryLabel: "Employés",
              subRows: [
                {
                  label: "Moins de 30 ans",
                  cols: ["-", "-"],
                },
                {
                  label: "De 30 à 39 ans",
                  cols: ["-", "-"],
                },
                {
                  label: "De 40 à 49 ans",
                  cols: ["-", "-"],
                },
                {
                  label: "50 ans et plus",
                  cols: ["-", "-"],
                },
              ],
            },
            {
              categoryLabel: "Techniciens et agents de maîtrise",
              subRows: [
                {
                  label: "Moins de 30 ans",
                  cols: ["-", "-"],
                },
                {
                  label: "De 30 à 39 ans",
                  cols: ["-", "-"],
                },
                {
                  label: "De 40 à 49 ans",
                  cols: ["-", "-"],
                },
                {
                  label: "50 ans et plus",
                  cols: ["-", "-"],
                },
              ],
            },
            {
              categoryLabel: "Ingénieurs et cadres",
              subRows: [
                {
                  label: "Moins de 30 ans",
                  cols: ["-", "-"],
                },
                {
                  label: "De 30 à 39 ans",
                  cols: ["-", "-"],
                },
                {
                  label: "De 40 à 49 ans",
                  cols: ["-", "-"],
                },
                {
                  label: "50 ans et plus",
                  cols: ["-", "-"],
                },
              ],
            },
          ]}
          footer={[
            {
              label: "Ensemble des salariés",
              data: "-",
              colspan: 2,
            },
            {
              label: `Femme`,
              data: "-",
            },
            {
              label: `Homme`,
              data: "-",
            },
          ]}
        />
      </CenteredContainer>
    </form>
  );
};
