import { indicatorNoteMax } from "@common/core-domain/computers/DeclarationComputer";
import { type DeclarationOpmc } from "@common/core-domain/domain/DeclarationOpmc";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { NAF } from "@common/dict";
import { formatDateToFr } from "@common/utils/date";
import { isEqual } from "date-fns";

import { BaseReceiptTemplate, type BaseReceiptTemplateProps } from "./BaseReceiptTemplate";

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
            ...(declaration.remunerations.categories
              ? [
                  {
                    key: "Nombre de niveaux ou coefficients",
                    value: declaration.remunerations.categories.length,
                  },
                ]
              : []),
            ...(declaration.remunerations.cseConsultationDate
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
                value: declaration.publication.url,
              },
            ]
          : []),
        ...(declaration.publication.modalities && !declaration.publication?.url
          ? [
              {
                key: "Modalités de communication auprès des salariés",
                value: declaration.publication.modalities,
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

    if (!declaration.remunerations?.notComputableReason) {
      if (declaration.remunerations?.score?.getValue() !== indicatorNoteMax["remunerations"])
        rows.push({
          key: "Objectif Indicateur écart de rémunération",
          value: input.objectiveRemunerations?.getValue() ?? "À définir",
          showAsBlock: true,
        });
    }

    if (declaration.company.range?.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
      if (!declaration.salaryRaisesAndPromotions?.notComputableReason) {
        if (
          declaration.salaryRaisesAndPromotions?.score?.getValue() !== indicatorNoteMax["augmentations-et-promotions"]
        ) {
          rows.push({
            key: "Objectif Indicateur écart de taux d'augmentations individuelles",
            value: input.objectiveSalaryRaiseAndPromotions?.getValue() ?? "À définir",
            showAsBlock: true,
          });
        }
      }
    } else {
      if (!declaration.salaryRaises?.notComputableReason) {
        if (declaration.salaryRaises?.score?.getValue() != indicatorNoteMax["augmentations"]) {
          rows.push({
            key: "Objectif Indicateur écart de taux d'augmentations individuelles (hors promotions)",
            value: input.objectiveSalaryRaise?.getValue() ?? "À définir",
            showAsBlock: true,
          });
        }
      }

      if (!declaration.promotions?.notComputableReason) {
        if (declaration.promotions?.score?.getValue() !== indicatorNoteMax["promotions"]) {
          rows.push({
            key: "Objectif Indicateur écart de taux de promotions",
            value: input.objectivePromotions?.getValue() ?? "À définir",
            showAsBlock: true,
          });
        }
      }
    }

    if (!declaration.maternityLeaves?.notComputableReason) {
      if (declaration.maternityLeaves?.score?.getValue() !== indicatorNoteMax["conges-maternite"]) {
        rows.push({
          key: "Objectif Indicateur retour de congé maternité",
          value: input.objectiveMaternityLeaves?.getValue() ?? "À définir",
          showAsBlock: true,
        });
      }
    }

    if (declaration.highRemunerations?.score?.getValue() !== indicatorNoteMax["hautes-remunerations"]) {
      rows.push({
        key: "Objectif Indicateur dix plus hautes rémunérations",
        value: input.objectiveHighRemunerations?.getValue() ?? "À définir",
        showAsBlock: true,
      });
    }

    rows.push({
      key: "Date de publication des objectifs",
      value: input.objectivesPublishDate ? formatDateToFr(input.objectivesPublishDate) : "À définir",
    });

    if (declaration.index.getValue() < 75) {
      rows.push({
        key: "Date de publication des mesures de correction",
        value: input.measuresPublishDate ? formatDateToFr(input.measuresPublishDate) : "À définir",
      });

      if (declaration.publication?.url || declaration.index.getValue() < 75) {
        rows.push({
          key: "Modalités de communication des mesures de correction auprès des salariés",
          value: input.objectivesMeasuresModalities?.getValue() ?? "À définir",
          showAsBlock: true,
        });
      }
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
      subject="Récapitulatif de la déclaration de votre index de l'égalité professionnelle entre les femmes et les hommes"
      declaredAt={declaration.declaredAt}
      modifiedAt={isEqual(declaration.declaredAt, declaration.modifiedAt) ? undefined : declaration.modifiedAt}
      siren={declaration.siren.getValue()}
      year={declaration.year.getValue()}
      table={table}
    />
  );
};
