"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { NotComputableReason } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReason";
import { type SearchDeclarationResultDTO } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { addressLabel } from "@common/dict";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Link from "next/link";
import { useState } from "react";

import { Container } from "../../layout/Container";
import { Grid, GridCol } from "../Grid";
import {
  TileCompany,
  TileCompanyLoadMore,
  TileCompanyLocation,
  TileCompanyScore,
  TileCompanySiren,
  TileCompanyTable,
  TileCompanyTableBodyRow,
  TileCompanyTableBodyRowCol,
  TileCompanyTableHead,
  TileCompanyTableHeadCol,
  TileCompanyTitle,
  TileCompanyYear,
} from "../TileCompany";
import { Text } from "../Typography";
import { AccessibleInfoIcon } from "./AccessibleInfoIcon";
import styles from "./TileCompanyIndex.module.css";

const mapRange = (range: CompanyWorkforceRange.Enum | undefined) => {
  switch (range) {
    case CompanyWorkforceRange.Enum.FROM_1000_TO_MORE:
      return "1000";
    case CompanyWorkforceRange.Enum.FROM_251_TO_999:
      return "251 à 999";
    case CompanyWorkforceRange.Enum.FROM_50_TO_250:
      return "50 à 250";
    default:
      return "0";
  }
};

export const TileCompanyIndex = (dto: SearchDeclarationResultDTO) => {
  const { company, results, name, siren } = dto;
  const rowsDefault = 3;
  const [animationTBody] = useAutoAnimate();
  const [rowsNumber, setRowsNumber] = useState(rowsDefault);
  const handleMoreRows = () => {
    setRowsNumber(rowsNumber + rowsDefault);
  };

  const [uesListOpened, setUesListOpened] = useState(false);

  const years = Object.keys(results)
    .map(year => Number(year))
    .sort()
    .reverse();

  const lastYear = years[0];
  const { county, region, ues, workforce, countryIsoCode } = company[lastYear];
  const isUES = !!ues?.companies.length && !!ues?.name;

  const address = addressLabel({ county, region, country: countryIsoCode });

  return (
    <TileCompany>
      <Container fluid>
        <Grid valign="middle" align="center">
          <GridCol sm={9}>
            <TileCompanyTitle ues={isUES}>
              <DebugButton obj={dto} infoText="TileCompanyIndex" />
              {isUES && ues.name.trim() ? `${ues.name} (${name})` : name}
            </TileCompanyTitle>
            <TileCompanySiren>{siren}</TileCompanySiren>
            {address && <TileCompanyLocation>{address}</TileCompanyLocation>}
          </GridCol>
          <GridCol sm={3}>
            {workforce && workforce.range && (
              <div className={fr.cx("fr-mt-1v", "fr-mt-md-0")}>
                <span className={styles.numberOfEmployees}>Tranche effectifs assujettis :</span>
                <span className={styles.employeeslegend}>{CompanyWorkforceRange.Label[workforce.range]}</span>
              </div>
            )}
          </GridCol>
        </Grid>
      </Container>
      {isUES && (
        <div className={fr.cx("fr-mt-1v")}>
          <span
            aria-hidden
            className={cx(
              fr.cx("fr-icon--sm", uesListOpened ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"),
              "align-bottom",
              "text-dsfr-action-high-blue-france",
            )}
          ></span>
          <Link
            href="#"
            className={fr.cx("fr-link", "fr-link--sm", "fr-ml-1v")}
            onClick={evt => {
              evt.preventDefault();
              uesListOpened ? setUesListOpened(false) : setUesListOpened(true);
            }}
          >
            Voir les autres entreprises composant l'UES
          </Link>
          {uesListOpened && (
            <ul className={fr.cx("fr-ml-2w")}>
              {ues?.companies.map(company => (
                <li key={company.siren} className={fr.cx("fr-text--xs", "fr-m-0")}>
                  <strong>{company.name}</strong> ({company.siren})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <TileCompanyTable>
        <TileCompanyTableHead>
          <TileCompanyTableHeadCol>Année</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Note</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Détails</TileCompanyTableHeadCol>
        </TileCompanyTableHead>
        <tbody ref={animationTBody}>
          {years
            .map(year => ({
              year,
              ...results[year],
            }))
            .slice(0, rowsNumber)
            .map(row => (
              <TileCompanyTableBodyRow key={row.year}>
                <TileCompanyTableBodyRowCol>
                  <TileCompanyYear year={row.year + 1} />
                  {company[row.year].workforce?.range !== company[lastYear].workforce?.range && (
                    <AccessibleInfoIcon
                      description={`Tranche en ${row.year + 1} : ${mapRange(
                        company[row.year].workforce?.range,
                      )} salariés${
                        company[row.year].workforce?.range === CompanyWorkforceRange.Enum.FROM_1000_TO_MORE
                          ? " ou plus"
                          : ""
                      }`}
                    />
                  )}
                </TileCompanyTableBodyRowCol>
                <TileCompanyTableBodyRowCol>
                  <div
                    className={cx(styles.note)}
                    title={
                      row.highRemunerationsScore === null
                        ? "Période de réference de 12 mois insuffisante"
                        : "Les indicateurs calculables représentent moins de 75 points"
                    }
                  >
                    <TileCompanyScore score={`${row.index ?? "NC"}`} />
                    {row.index === null && (
                      <AccessibleInfoIcon description="Les indicateurs calculables représentent moins de 75 points" />
                    )}
                  </div>
                </TileCompanyTableBodyRowCol>
                <TileCompanyTableBodyRowCol>
                  <ul className={cx(fr.cx("fr-m-0", "fr-p-0"), styles.list)}>
                    <li>
                      Écart rémunérations : <Text inline variant="bold" text={`${row.remunerationsScore ?? "NC"}`} />
                      {row.notComputableReasonRemunerations && (
                        <AccessibleInfoIcon
                          description={NotComputableReason.Label[row.notComputableReasonRemunerations]}
                        />
                      )}
                    </li>
                    <li>
                      Écart taux d'augmentations :{" "}
                      {company[row.year].workforce?.range !== CompanyWorkforceRange.Enum.FROM_251_TO_999 &&
                      company[row.year].workforce?.range !== CompanyWorkforceRange.Enum.FROM_1000_TO_MORE ? (
                        <>
                          <Text inline variant="bold" text={`${row.salaryRaisesAndPromotionsScore ?? "NC"}`} />
                          {row.notComputableReasonSalaryRaisesAndPromotions && (
                            <AccessibleInfoIcon
                              description={NotComputableReason.Label[row.notComputableReasonSalaryRaisesAndPromotions]}
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <Text inline variant="bold" text={`${row.salaryRaisesScore ?? "NC"}`} />
                          {row.notComputableReasonSalaryRaises && (
                            <AccessibleInfoIcon
                              description={NotComputableReason.Label[row.notComputableReasonSalaryRaises]}
                            />
                          )}
                        </>
                      )}
                    </li>
                    {company[row.year].workforce?.range !== CompanyWorkforceRange.Enum.FROM_50_TO_250 && (
                      <li>
                        Écart taux promotions : <Text inline variant="bold" text={`${row.promotionsScore ?? "NC"}`} />
                        {row.notComputableReasonPromotions && (
                          <AccessibleInfoIcon
                            description={NotComputableReason.Label[row.notComputableReasonPromotions]}
                          />
                        )}
                      </li>
                    )}
                    <li>
                      Retour congé maternité :{" "}
                      <Text inline variant="bold" text={`${row.maternityLeavesScore ?? "NC"}`} />
                      {row.notComputableReasonMaternityLeaves && (
                        <AccessibleInfoIcon
                          description={NotComputableReason.Label[row.notComputableReasonMaternityLeaves]}
                        />
                      )}
                    </li>
                    <li>
                      Hautes rémunérations :{" "}
                      <Text inline variant="bold" text={`${row.highRemunerationsScore ?? "NC"}`} />
                    </li>
                  </ul>
                </TileCompanyTableBodyRowCol>
              </TileCompanyTableBodyRow>
            ))}
        </tbody>
      </TileCompanyTable>
      {rowsNumber < years?.length && <TileCompanyLoadMore onClick={handleMoreRows} />}
    </TileCompany>
  );
};
