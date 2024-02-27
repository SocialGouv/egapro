import { type RepresentationEquilibree } from "@common/core-domain/domain/RepresentationEquilibree";
import { NAF } from "@common/dict";
import { formatDateToFr } from "@common/utils/date";
import { formatPrettyFloat, truncFloatToDecimal } from "@common/utils/number";
import { isEqual } from "date-fns";

import { BaseReceiptTemplate, type BaseReceiptTemplateProps } from "./BaseReceiptTemplate";

const insertSoftHyphens = (url: string, everyNChars: number) => {
  const parts = [];
  for (let i = 0; i < url.length; i += everyNChars) {
    parts.push(url.substring(i, i + everyNChars));
  }
  return parts.join(" ");
};

export interface RepresentationEquilibreeReceiptProps {
  repEq: RepresentationEquilibree;
}

export const RepresentationEquilibreeReceipt = ({ repEq }: RepresentationEquilibreeReceiptProps) => {
  const nafCode = repEq.company.nafCode.getValue();

  const table: BaseReceiptTemplateProps["table"] = [
    {
      title: "Informations déclarant",
      rows: [
        {
          key: "Nom Prénom",
          value: `${repEq.declarant.lastname} ${repEq.declarant.firstname}`,
        },
        {
          key: "Adresse mail",
          value: repEq.declarant.email.getValue(),
        },
      ],
    },
    {
      title: "Informations entreprise",
      rows: [
        {
          key: "Raison sociale",
          value: repEq.company.name,
        },
        {
          key: "Siren",
          value: repEq.siren.getValue(),
        },
        {
          key: "Code NAF",
          value: `${nafCode} - ${NAF[nafCode] ? NAF[nafCode].description : ""}`,
        },
        {
          key: "Adresse",
          value: `${repEq.company.address} ${repEq.company.postalCode?.getValue()} ${repEq.company.city}`,
        },
      ],
    },
    {
      title: "Période de référence",
      rows: [
        {
          key: "Année au titre de laquelle les écarts sont calculés",
          value: repEq.year.getValue(),
        },
        {
          key: "Date de fin de la période de douze mois consécutifs correspondant à l'exercice comptable pour le calcul des écarts",
          value: formatDateToFr(repEq.endReferencePeriod),
        },
      ],
    },
    {
      title: "Écarts de représentation parmi les cadres dirigeants",
      rows: repEq.indicator.notComputableReasonExecutives
        ? [
            {
              key: "Motif de non calculabilité",
              value: repEq.indicator.notComputableReasonExecutives.getLabel(),
            },
          ]
        : [
            {
              key: "Pourcentage de femmes",
              value: `${formatPrettyFloat(truncFloatToDecimal(repEq.indicator.executiveWomenPercent!.getValue()))} %`,
            },
            {
              key: "Pourcentage d'hommes",
              value: `${formatPrettyFloat(truncFloatToDecimal(repEq.indicator.executiveMenPercent!.getValue()))} %`,
            },
          ],
    },
    {
      title: "Écarts de représentation parmi les membres des instances dirigeantes",
      rows: repEq.indicator.notComputableReasonMembers
        ? [
            {
              key: "Motif de non calculabilité",
              value: repEq.indicator.notComputableReasonMembers.getLabel(),
            },
          ]
        : [
            {
              key: "Pourcentage de femmes",
              value: `${formatPrettyFloat(truncFloatToDecimal(repEq.indicator.memberWomenPercent!.getValue()))} %`,
            },
            {
              key: "Pourcentage d'hommes",
              value: `${formatPrettyFloat(truncFloatToDecimal(repEq.indicator.memberMenPercent!.getValue()))} %`,
            },
          ],
    },
  ];

  if (repEq.publication) {
    table.push({
      title: "Publication des écarts de représentation",
      rows: [
        {
          key: "Date de publication",
          value: formatDateToFr(repEq.publication.date),
        },
        repEq.publication.url
          ? {
              key: "Site Internet de publication",
              value: insertSoftHyphens(repEq.publication.url, 70),
              showAsBlock: true,
            }
          : {
              key: "Modalités de communication auprès des salariés",
              value: repEq.publication.modalities,
              showAsBlock: true,
            },
      ],
    });
  }

  return (
    <BaseReceiptTemplate
      title="Représentation Équilibrée"
      subject="Récapitulatif de la déclaration des écarts éventuels de représentation femmes-hommes dans les postes de direction"
      declaredAt={repEq.declaredAt}
      modifiedAt={isEqual(repEq.declaredAt, repEq.modifiedAt) ? void 0 : repEq.modifiedAt}
      siren={repEq.siren.getValue()}
      year={repEq.year.getValue()}
      table={table}
    />
  );
};
