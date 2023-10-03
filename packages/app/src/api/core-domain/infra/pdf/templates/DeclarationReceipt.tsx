import { type Declaration } from "@common/core-domain/domain/Declaration";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { NAF } from "@common/dict";
import { formatDateToFr } from "@common/utils/date";
import { isEqual } from "date-fns";

import { BaseReceiptTemplate, type BaseReceiptTemplateProps } from "./BaseReceiptTemplate";

export interface DeclarationReceiptProps {
  declaration: Declaration;
}

export const DeclarationReceipt = ({ declaration }: DeclarationReceiptProps) => {
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
      title: "Informations entreprise",
      rows: [
        {
          key: "Structure",
          value: declaration.company.ues?.name ? "Unité Economique et Sociale (UES)" : "Entreprise",
        },
        {
          key: "Tranche effectifs",
          value: declaration.company.range?.getValue(),
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
                value: declaration.company.ues?.companies.length,
              },
            ]),
      ],
    },
    {
      title: "Période de référence",
      rows: [
        {
          key: "Année au titre de laquelle les écarts sont calculés",
          value: declaration.year.getValue(),
        },
        {
          key: "Date de fin de la période de douze mois consécutifs correspondant à l'exercice comptable pour le calcul des écarts",
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
              key: "Nombre de points obtenus",
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
        value: declaration.computablePoints?.getValue(),
      },
      {
        key: "Résultat final sur 100 points",
        value: declaration.index?.getValue() ?? "Non calculable",
      },
      ...(declaration.correctiveMeasures?.getValue()
        ? [
            {
              key: "Mesures de corrections prévues",
              value: declaration.correctiveMeasures.getValue(),
            },
          ]
        : []),
    ],
  });

  if (declaration.publication) {
    table.push({
      title: "Publication",
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
        ...(declaration.publication.modalities
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

  if (declaration.index && declaration.index.getValue() < 75) {
    const indicatorsDependingOnRange: BaseReceiptTemplateProps.Row[] =
      declaration.company.range?.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250
        ? [
            {
              key: "Objectif Indicateur écart de taux d'augmentations individuelles",
              value: declaration.salaryRaisesAndPromotions?.progressObjective ?? "NA",
            },
          ]
        : [
            {
              key: "Objectif Indicateur écart de taux d'augmentations individuelles (hors promotions)",
              value: declaration.salaryRaises?.progressObjective ?? "NA",
            },
            {
              key: "Objectif Indicateur écart de taux de promotions",
              value: declaration.promotions?.progressObjective ?? "NA",
            },
          ];

    const rows: [BaseReceiptTemplateProps.Row, ...BaseReceiptTemplateProps.Row[]] = [
      {
        key: "Objectif Indicateur écart de rémunération",
        value: declaration.remunerations?.progressObjective ?? "NA",
      },
      ...indicatorsDependingOnRange,
      {
        key: "Objectif Indicateur retour de congé maternité",
        value: declaration.maternityLeaves?.progressObjective ?? "NA",
      },
      {
        key: "Objectif Indicateur dix plus hautes rémunérations",
        value: declaration.highRemunerations?.progressObjective ?? "NA",
      },
      {
        key: "Date de publication des objectifs",
        value: declaration.publication?.objectivesPublishDate
          ? formatDateToFr(declaration.publication.objectivesPublishDate)
          : "NA",
      },
      {
        key: "Modalités de communication auprès des salariés",
        value: declaration.publication?.objectivesMeasuresModalities,
      },
      ...(declaration.publication?.measuresPublishDate
        ? [
            {
              key: "Date de publication des mesures de correction",
              value: formatDateToFr(declaration.publication.measuresPublishDate),
            },
          ]
        : []),
    ];

    table.push({
      title: "Objectifs de progression et mesures de correction",
      rows,
    });
  }

  return (
    <BaseReceiptTemplate
      title="Déclaration"
      subject="Récapitulatif de la déclaration Egapro"
      declaredAt={declaration.declaredAt}
      modifiedAt={isEqual(declaration.declaredAt, declaration.modifiedAt) ? undefined : declaration.modifiedAt}
      siren={declaration.siren.getValue()}
      year={declaration.year.getValue()}
      table={table}
    />
  );
};
