import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { type DeclarationOpmc } from "@common/core-domain/domain/DeclarationOpmc";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { NAF } from "@common/dict";
import { type NonEmptyString } from "@common/shared-domain/domain/valueObjects/NonEmptyString";
import { formatDateToFr } from "@common/utils/date";
import { isEqual } from "date-fns";

import { BaseReceiptTemplate, type BaseReceiptTemplateProps } from "./BaseReceiptTemplate";

const insertSoftHyphens = (url: string, everyNChars: number) => {
  const parts = [];
  for (let i = 0; i < url.length; i += everyNChars) {
    parts.push(url.substring(i, i + everyNChars));
  }
  return parts.join(" ");
};

const pushRow = (
  rows: BaseReceiptTemplateProps.Row[],
  key: string,
  value: NonEmptyString | string | { getValue: () => string | undefined } | undefined,
  showAsBlock: boolean = true,
) => {
  const valueStr = typeof value === "string" ? value : value?.getValue ? value.getValue() : undefined;

  rows.push({
    key: key,
    value: valueStr ?? "À définir",
    showAsBlock: showAsBlock,
  });
};

export const DeclarationReceipt = (input: DeclarationOpmc) => {
  const declaration = input.declaration;

  const nafCode = declaration.company.nafCode.getValue();

  const table: BaseReceiptTemplateProps["table"] = [
    {
      title: "Informations déclarant",
      rows: [
        {
          key: "Nom Prénom",
          value: `${declaration.declarant.lastname} ${declaration.declarant.firstname}`,
        },
        {
          key: "Adresse mail",
          value: declaration.declarant.email.getValue(),
        },
      ],
    },
    {
      title: "Informations entreprise/UES",
      rows: [
        {
          key: "Structure",
          value: declaration.company.ues?.name ? "Unité Economique et Sociale (UES)" : "Entreprise",
        },
        {
          key: "Tranche effectifs",
          value: declaration.company.range?.getLabel(),
        },
        {
          key: "Raison sociale",
          value: declaration.company.name,
        },
        {
          key: "Siren",
          value: declaration.siren.getValue(),
        },
        {
          key: "Code NAF",
          value: `${nafCode} - ${NAF[nafCode].description}`,
        },
        {
          key: "Adresse",
          value: `${declaration.company.address} ${declaration.company.postalCode?.getValue()} ${
            declaration.company.city
          }`,
        },
        ...(declaration.company.ues?.name === undefined
          ? []
          : [
              {
                key: "Nom UES",
                value: declaration.company.ues?.name,
              },
              {
                key: "Nombre d'entreprises composant l'UES",
                value: declaration.company.ues?.companies.length + 1,
              },
            ]),
      ],
    },
    {
      title: "Informations calcul et période de référence",
      rows: [
        {
          key: "Année au titre de laquelle les indicateurs sont calculés",
          value: declaration.year.getValue(),
        },
        {
          key: "Date de fin de la période de référence",
          value: declaration.endReferencePeriod ? formatDateToFr(declaration.endReferencePeriod) : "NA",
        },
        {
          key: "Nombre de salariés pris en compte pour le calcul des indicateurs",
          value: declaration.company.total?.getValue(),
        },
      ],
    },
  ];

  if (declaration.remunerations) {
    table.push({
      title: "Indicateur relatif à l'écart de rémunération",
      rows: declaration.remunerations.notComputableReason
        ? [
            {
              key: "Motif de non calculabilité",
              value: declaration.remunerations.notComputableReason.getLabel(),
            },
          ]
        : [
            {
              key: "Modalité de calcul",
              value:
                declaration.remunerations.mode?.getValue() !== undefined
                  ? declaration.remunerations.mode.getLabel()
                  : "",
            },
            ...(declaration.remunerations.categories &&
            declaration.remunerations.mode?.getValue() !== RemunerationsMode.Enum.CSP
              ? [
                  {
                    key: "Nombre de niveaux ou coefficients",
                    value: declaration.remunerations.categories.length,
                  },
                ]
              : []),
            ...(declaration.remunerations.cseConsultationDate &&
            declaration.remunerations.mode?.getValue() !== RemunerationsMode.Enum.CSP
              ? [
                  {
                    key: "Date de consultation du CSE",
                    value: formatDateToFr(declaration.remunerations.cseConsultationDate),
                  },
                ]
              : []),
            {
              key: "Résultat final en %",
              value: declaration.remunerations.result?.getValue(),
            },
            {
              key: "Population envers laquelle l'écart est favorable",
              value: declaration.remunerations.favorablePopulation?.getLabel(),
            },
            {
              key: "Nombre de points obtenus",
              value: declaration.remunerations.score?.getValue(),
            },
          ],
    });
  }

  if (declaration.company.range?.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
    table.push({
      title: "Indicateur relatif à l'écart de taux d'augmentations individuelles",
      rows: declaration.salaryRaisesAndPromotions?.notComputableReason
        ? [
            {
              key: "Motif de non calculabilité",
              value: declaration.salaryRaisesAndPromotions.notComputableReason.getLabel(),
            },
          ]
        : [
            {
              key: "Résultat final en %",
              value: declaration.salaryRaisesAndPromotions?.result?.getValue(),
            },
            {
              key: "Résultat final en nombre équivalent de salariés",
              value: declaration.salaryRaisesAndPromotions?.employeesCountResult?.getValue(),
            },
            {
              key: "Population envers laquelle l'écart est favorable",
              value: declaration.salaryRaisesAndPromotions?.favorablePopulation?.getLabel(),
            },
            {
              key: "Nombre de points obtenus sur le résultat final en pourcentage",
              value: declaration.salaryRaisesAndPromotions?.percentScore?.getValue(),
            },
            {
              key: "Nombre de points obtenus sur le résultat final en nombre de salariés",
              value: declaration.salaryRaisesAndPromotions?.score?.getValue(),
            },
            {
              key: "Nombre de points obtenus à l'indicateur",
              value: declaration.salaryRaisesAndPromotions?.score?.getValue(),
            },
          ],
    });
  } else {
    if (declaration.salaryRaises) {
      table.push({
        title: "Indicateur relatif à l'écart de taux d'augmentations individuelles (hors promotions)",
        rows: declaration.salaryRaises?.notComputableReason
          ? [
              {
                key: "Motif de non calculabilité",
                value: declaration.salaryRaises.notComputableReason.getLabel(),
              },
            ]
          : [
              {
                key: "Résultat final en %",
                value: declaration.salaryRaises.result?.getValue(),
              },
              {
                key: "Population envers laquelle l'écart est favorable",
                value: declaration.salaryRaises.favorablePopulation?.getLabel(),
              },
              {
                key: "Nombre de points obtenus",
                value: declaration.salaryRaises.score?.getValue(),
              },
            ],
      });
    }

    if (declaration.promotions) {
      table.push({
        title: "Indicateur relatif à l'écart de taux de promotions",
        rows: declaration.promotions.notComputableReason
          ? [
              {
                key: "Motif de non calculabilité",
                value: declaration.promotions.notComputableReason.getLabel(),
              },
            ]
          : [
              {
                key: "Résultat final en %",
                value: declaration.promotions.result?.getValue(),
              },
              {
                key: "Population envers laquelle l'écart est favorable",
                value: declaration.promotions.favorablePopulation?.getLabel(),
              },
              {
                key: "Nombre de points obtenus",
                value: declaration.promotions.score?.getValue(),
              },
            ],
      });
    }
  }

  if (declaration.maternityLeaves) {
    table.push({
      title:
        "Indicateur relatif au % de salariées ayant bénéficié d'une augmentation dans l'année suivant leur retour de congé maternité",
      rows: declaration.maternityLeaves.notComputableReason
        ? [
            {
              key: "Motif de non calculabilité",
              value: declaration.maternityLeaves.notComputableReason.getLabel(),
            },
          ]
        : [
            {
              key: "Résultat final en %",
              value: declaration.maternityLeaves.result?.getValue(),
            },
            {
              key: "Nombre de points obtenus",
              value: declaration.maternityLeaves.score?.getValue(),
            },
          ],
    });
  }

  if (declaration.highRemunerations) {
    table.push({
      title:
        "Indicateur relatif au nombre de salariés du sexe sous-représenté parmi les 10 salariés ayant perçu les plus hautes rémunératons",
      rows: [
        {
          key: "Résultat en nombre de salariés du sexe sous-représenté",
          value: declaration.highRemunerations.result?.getValue(),
        },
        {
          key: "Sexe des salariés sur-représentés",
          value: declaration.highRemunerations.favorablePopulation.getLabel(),
        },
        {
          key: "Nombre de points obtenus",
          value: declaration.highRemunerations.score.getValue(),
        },
      ],
    });
  }

  table.push({
    title: "Niveau de résultat global",
    rows: [
      {
        key: "Total de points obtenus",
        value: declaration.points?.getValue(),
      },
      {
        key: "Nombre de points maximum pouvant être obtenus",
        value: declaration.computablePoints?.getValue(),
      },
      {
        key: "Résultat final sur 100 points",
        value: declaration.index?.getValue() ?? "Non calculable",
      },
      ...(declaration.correctiveMeasures?.getValue()
        ? [
            {
              key: "Mesures de correction prévues",
              value: declaration.correctiveMeasures?.getLabel(),
            },
          ]
        : []),
    ],
  });

  if (declaration.publication) {
    table.push({
      title: "Publication des résultats obtenus",
      rows: [
        {
          key: "Date de publication",
          value: declaration.publication.date ? formatDateToFr(declaration.publication.date) : "NA",
        },
        ...(declaration.publication.url
          ? [
              {
                key: "Site Internet de publication",
                value: insertSoftHyphens(declaration.publication.url, 50),
              },
            ]
          : []),
        ...(declaration.publication.modalities && !declaration.publication?.url
          ? [
              {
                key: "Modalités de communication auprès des salariés",
                value: declaration.publication.modalities,
                showAsBlock: true,
              },
            ]
          : []),
      ],
    });
  }

  if (declaration.index && declaration.index.getValue() < 85) {
    const rows: [BaseReceiptTemplateProps.Row, ...BaseReceiptTemplateProps.Row[]] = [
      {
        key: "",
        value: "",
      },
    ];

    if (
      !declaration.remunerations?.notComputableReason &&
      declaration.remunerations?.score?.getValue() !== indicatorNoteMax["remunerations"]
    ) {
      pushRow(rows, "Objectif Indicateur écart de rémunération", input.objectiveRemunerations);
    }

    if (declaration.company.range?.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
      if (
        !declaration.salaryRaisesAndPromotions?.notComputableReason &&
        declaration.salaryRaisesAndPromotions?.score?.getValue() !== indicatorNoteMax["augmentations-et-promotions"]
      ) {
        pushRow(
          rows,
          "Objectif Indicateur écart de taux d'augmentations individuelles",
          input.objectiveSalaryRaiseAndPromotions,
        );
      }
    } else {
      if (
        !declaration.salaryRaises?.notComputableReason &&
        declaration.salaryRaises?.score?.getValue() != indicatorNoteMax["augmentations"]
      ) {
        pushRow(
          rows,
          "Objectif Indicateur écart de taux d'augmentations individuelles (hors promotions)",
          input.objectiveSalaryRaise,
        );
      }

      if (
        !declaration.promotions?.notComputableReason &&
        declaration.promotions?.score?.getValue() !== indicatorNoteMax["promotions"]
      ) {
        pushRow(rows, "Objectif Indicateur écart de taux de promotions", input.objectivePromotions);
      }
    }

    if (
      !declaration.maternityLeaves?.notComputableReason &&
      declaration.maternityLeaves?.score?.getValue() !== indicatorNoteMax["conges-maternite"]
    ) {
      pushRow(rows, "Objectif Indicateur retour de congé maternité", input.objectiveMaternityLeaves);
    }

    if (declaration.highRemunerations?.score?.getValue() !== indicatorNoteMax["hautes-remunerations"]) {
      pushRow(rows, "Objectif Indicateur dix plus hautes rémunérations", input.objectiveHighRemunerations);
    }

    pushRow(
      rows,
      "Date de publication des objectifs",
      input.objectivesPublishDate ? formatDateToFr(input.objectivesPublishDate) : "À définir",
      false,
    );

    if (declaration.index.getValue() < 75) {
      pushRow(
        rows,
        "Date de publication des mesures de correction",
        input.measuresPublishDate ? formatDateToFr(input.measuresPublishDate) : "À définir",
        false,
      );

      if (!declaration.publication?.url && declaration.year.getValue() > 2020) {
        pushRow(rows, "Modalités de communication auprès des salariés", input.objectivesMeasuresModalities);
      }

      if (declaration.publication?.url) {
        pushRow(
          rows,
          "Modalités de communication des mesures de correction auprès des salariés",
          input.objectivesMeasuresModalities,
        );
      }
    }

    if (
      !declaration.publication?.url &&
      declaration.year.getValue() > 2020 &&
      declaration.index.getValue() >= 75 &&
      declaration.index.getValue() <= 84
    ) {
      pushRow(rows, "Modalités de communication auprès des salariés", input.objectivesMeasuresModalities);
    }

    table.push({
      title:
        declaration.index.getValue() >= 75 && declaration.index.getValue() <= 84
          ? "Objectifs de progression"
          : "Objectifs de progression et mesures de correction",
      rows,
    });
  }

  return (
    <BaseReceiptTemplate
      title="Déclaration"
      subject="Récapitulatif de la déclaration de l'index de l'égalité professionnelle femmes-hommes"
      declaredAt={declaration.declaredAt}
      modifiedAt={isEqual(declaration.declaredAt, declaration.modifiedAt) ? undefined : declaration.modifiedAt}
      siren={declaration.siren.getValue()}
      year={declaration.year.getValue()}
      table={table}
    />
  );
};
