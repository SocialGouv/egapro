import Alert from "@codegouvfr/react-dsfr/Alert";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { AlternativeTable, Link } from "@design-system";

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
        header={[
          {
            label: "Catégorie socioprofessionnelle",
          },
          {
            label: "Tranche d’âge",
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
            categoryLabel: "Plop",
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
            label: <>0&nbsp;femme - 0&nbsp;homme</>,
            data: "-",
            colspan: 2,
          },
        ]}
      />

      <AlternativeTable
        classeName="fr-mt-2w"
        header={[
          {
            label: "Catégorie socioprofessionnelle",
          },
          {
            label: "Tranche d’âge",
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
            categoryLabel: "Plop",
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
            label: <>0&nbsp;femme - 0&nbsp;homme</>,
            data: "-",
            colspan: 2,
          },
        ]}
      />
    </form>
  );
};
