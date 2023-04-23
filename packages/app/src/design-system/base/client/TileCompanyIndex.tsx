"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { adressLabel } from "@common/dict";
import { type CompanyType, type TrancheType } from "@common/models/company";
import Link from "next/link";
import { useState } from "react";

import { Container } from "../../layout/Container";
import { Grid, GridCol } from "../Grid";
import { Stat } from "../Stat";
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

export type data = { men?: number; women?: number };

export type TileCompanyRepeqsProps = {
  data: Array<{
    executivesManagers: data;
    governingMembers: data;
    year: number;
  }>;
  location: string;
  siren: string;
  title: string;
};

const mapTrancheType: Record<TrancheType, string> = {
  "1000:": "1000",
  "251:999": "251 à 999",
  "50:250": "50 à 250",
};

export const TileCompanyIndex = ({ entreprise, ...stats }: CompanyType) => {
  const { département, région, raison_sociale, siren, ues } = entreprise;
  const isUES = !!ues?.entreprises.length && !!ues?.nom;

  const rowsDefault = 3;
  const [rowsNumber, setRowsNumber] = useState(rowsDefault);
  const handleMoreRows = () => {
    setRowsNumber(rowsNumber + rowsDefault);
  };

  const [uesListOpened, setUesListOpened] = useState(false);

  const years = Object.keys(stats.notes)
    .map(year => Number(year))
    .sort()
    .reverse();

  return (
    <TileCompany>
      <Container fluid>
        <Grid>
          <GridCol sm={9}>
            <TileCompanyTitle ues={isUES}>{isUES ? ues.nom : raison_sociale}</TileCompanyTitle>
            <TileCompanySiren>{siren}</TileCompanySiren>
            <TileCompanyLocation>{adressLabel({ county: département, region: région })}</TileCompanyLocation>
          </GridCol>
          <GridCol sm={3}>
            <Stat
              text={mapTrancheType[entreprise.effectif.tranche]}
              helpText="Salariés ou plus"
              display={{ asText: ["xl", "bold"] }}
            />
          </GridCol>
        </Grid>
      </Container>
      {isUES && (
        <>
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
            Voir les entreprises composant l'UES
          </Link>
          {uesListOpened && (
            <ol className={fr.cx("fr-ml-2w")}>
              {entreprise.ues?.entreprises.map(entreprise => (
                <li key={entreprise.siren} className={fr.cx("fr-text--sm", "fr-m-0")}>
                  {entreprise.raison_sociale} ({entreprise.siren})
                </li>
              ))}
            </ol>
          )}
        </>
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
              note_augmentations: stats.notes_augmentations[year],
              note_augmentations_et_promotions: stats.notes_augmentations_et_promotions[year],
              note_conges_maternite: stats.notes_conges_maternite[year],
              note_hautes_rémunérations: stats.notes_hautes_rémunérations[year],
              note_promotions: stats.notes_promotions[year],
              note_remunerations: stats.notes_remunerations[year],
              note: stats.notes[year],
            }))
            .slice(0, rowsNumber)
            .map(row => (
              <TileCompanyTableBodyRow key={row.year}>
                <TileCompanyTableBodyRowCol>
                  <TileCompanyYear year={row.year + 1} />
                </TileCompanyTableBodyRowCol>
                <TileCompanyTableBodyRowCol>
                  <TileCompanyScore score={`${row.note ?? "NC"}`} />
                </TileCompanyTableBodyRowCol>
                <TileCompanyTableBodyRowCol>
                  <Container fluid style={{ textAlign: "left" }}>
                    <Grid>
                      <GridCol xl={6}>
                        Écart rémunérations : <Text inline variant="bold" text={`${row.note_remunerations ?? "NC"}`} />
                      </GridCol>
                      <GridCol xl={6}>
                        Retour congé maternité :{" "}
                        <Text inline variant="bold" text={`${row.note_conges_maternite ?? "NC"}`} />
                      </GridCol>
                    </Grid>
                    <Grid>
                      <GridCol xl={6}>
                        Écart taux d'augmentation :{" "}
                        {entreprise.effectif.tranche === "50:250" ? (
                          <Text inline variant="bold" text={`${row.note_augmentations_et_promotions ?? "NC"}`} />
                        ) : (
                          <Text inline variant="bold" text={`${row.note_augmentations ?? "NC"}`} />
                        )}
                      </GridCol>
                      <GridCol xl={6}>
                        Hautes rémunérations :{" "}
                        <Text inline variant="bold" text={`${row.note_hautes_rémunérations ?? "NC"}`} />
                      </GridCol>
                    </Grid>
                    {entreprise.effectif.tranche !== "50:250" && (
                      <Grid>
                        <GridCol xl={6}>
                          Écart taux promotion : <Text inline variant="bold" text={`${row.note_promotions ?? "NC"}`} />
                        </GridCol>
                      </Grid>
                    )}
                  </Container>
                </TileCompanyTableBodyRowCol>
              </TileCompanyTableBodyRow>
            ))}
        </TileCompanyTableBody>
      </TileCompanyTable>
      {rowsNumber < years?.length && <TileCompanyLoadMore onClick={handleMoreRows} />}
    </TileCompany>
  );
};
