"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { NotComputableReason } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReason";
import { type SearchDeclarationResultDTO } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { adressLabel, type WORKFORCES } from "@common/dict";
import { DebugButton } from "@components/utils/debug/DebugButton";
import Link from "next/link";
import { useState } from "react";

import { Container } from "../../layout/Container";
import { Grid, GridCol } from "../Grid";
import { Icon } from "../Icon";
import {
  TileCompany,
  TileCompanyLoadMore,
  TileCompanyLocation,
  TileCompanyScore,
  TileCompanySiren,
  TileCompanyTable,
  TileCompanyTableBody,
  TileCompanyTableBodyRow,
  TileCompanyTableBodyRowCol,
  TileCompanyTableHead,
  TileCompanyTableHeadCol,
  TileCompanyTitle,
  TileCompanyYear,
} from "../TileCompany";
import { Text } from "../Typography";
import styles from "./TileCompanyIndex.module.css";

const mapRange = (range: keyof WORKFORCES | undefined) => {
  switch (range) {
    case "1000:":
      return "1000";
    case "251:999":
      return "251 à 999";
    case "50:250":
      return "50 à 250";
    default:
      return "0";
  }
};

export const TileCompanyIndex = (dto: SearchDeclarationResultDTO) => {
  const { company, results, name, siren } = dto;
  const rowsDefault = 3;
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
  const { countyCode, regionCode, ues, workforce, countryIsoCode } = company[lastYear];
  const isUES = !!ues?.companies.length && !!ues?.name;

  const adress = adressLabel({ county: countyCode, region: regionCode, country: countryIsoCode });

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
            {adress && <TileCompanyLocation>{adress}</TileCompanyLocation>}
          </GridCol>
          <GridCol sm={3}>
            <div className={fr.cx("fr-mt-1v", "fr-mt-md-0")}>
              <span className={styles.numberOfEmployees}>{mapRange(workforce?.range)}</span>
              <span className={styles.employeeslegend}>{` Salariés${
                workforce?.range === "1000:" ? " ou plus" : ""
              }`}</span>
            </div>
          </GridCol>
        </Grid>
      </Container>
      {isUES && (
        <div className={fr.cx("fr-mt-1v")}>
          <span
            aria-hidden
            className={fr.cx("fr-icon--sm", uesListOpened ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line")}
            style={{ color: "var(--text-action-high-blue-france)", verticalAlign: "bottom" }}
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
        <TileCompanyTableBody>
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
                    <Icon
                      size="sm"
                      icon="fr-icon-information-fill"
                      color="text-mention-grey"
                      title={`Tranche en ${row.year + 1} : ${mapRange(company[row.year].workforce?.range)} salariés${
                        company[row.year].workforce?.range === "1000:" ? " ou plus" : ""
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
                    {row.index === null && <Icon size="sm" icon="fr-icon-information-fill" color="text-mention-grey" />}
                  </div>
                </TileCompanyTableBodyRowCol>
                <TileCompanyTableBodyRowCol>
                  <ul className={cx(fr.cx("fr-m-0", "fr-p-0"), styles.list)}>
                    <li>
                      Écart rémunérations : <Text inline variant="bold" text={`${row.remunerationsScore ?? "NC"}`} />
                      {row.notComputableReasonRemunerations && (
                        <Icon
                          size="xs"
                          color="text-mention-grey"
                          icon="fr-icon-information-fill"
                          title={NotComputableReason.Label[row.notComputableReasonRemunerations]}
                        />
                      )}
                    </li>
                    <li>
                      Écart taux d'augmentation :{" "}
                      {company[row.year].workforce?.range === "50:250" ? (
                        <>
                          <Text inline variant="bold" text={`${row.salaryRaisesAndPromotionsScore ?? "NC"}`} />
                          {row.notComputableReasonSalaryRaisesAndPromotions && (
                            <Icon
                              size="xs"
                              color="text-mention-grey"
                              icon="fr-icon-information-fill"
                              title={NotComputableReason.Label[row.notComputableReasonSalaryRaisesAndPromotions]}
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <Text inline variant="bold" text={`${row.salaryRaisesScore ?? "NC"}`} />
                          {row.notComputableReasonSalaryRaises && (
                            <Icon
                              size="xs"
                              color="text-mention-grey"
                              icon="fr-icon-information-fill"
                              title={NotComputableReason.Label[row.notComputableReasonSalaryRaises]}
                            />
                          )}
                        </>
                      )}
                    </li>
                    {company[row.year].workforce?.range !== "50:250" && (
                      <li>
                        Écart taux promotion : <Text inline variant="bold" text={`${row.promotionsScore ?? "NC"}`} />
                        {row.notComputableReasonPromotions && (
                          <Icon
                            size="xs"
                            color="text-mention-grey"
                            icon="fr-icon-information-fill"
                            title={NotComputableReason.Label[row.notComputableReasonPromotions]}
                          />
                        )}
                      </li>
                    )}
                    <li>
                      Retour congé maternité :{" "}
                      <Text inline variant="bold" text={`${row.maternityLeavesScore ?? "NC"}`} />
                      {row.notComputableReasonMaternityLeaves && (
                        <Icon
                          size="xs"
                          color="text-mention-grey"
                          icon="fr-icon-information-fill"
                          title={NotComputableReason.Label[row.notComputableReasonMaternityLeaves]}
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
        </TileCompanyTableBody>
      </TileCompanyTable>
      {rowsNumber < years?.length && <TileCompanyLoadMore onClick={handleMoreRows} />}
    </TileCompany>
  );
};
