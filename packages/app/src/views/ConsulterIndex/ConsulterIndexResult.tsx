/** @jsx jsx */
import { FC } from "react";
import { css, jsx } from "@emotion/core";
import {FetchedIndicatorsData} from "./ConsulterIndex";
import {AppState} from "../../globals";

interface ConsulterIndexResultProps {
  indicatorsData: FetchedIndicatorsData[]
}

const Cell:FC = ({ children }) => (
  <td css={styles.cell}>{children}</td>
);

const HeaderCell:FC = ({ children }) => (
  <th css={styles.cell}>{children}</th>
);

const formatUESList = (informationsEntreprise: AppState["informationsEntreprise"]) =>
  informationsEntreprise.entreprisesUES?.map(({ nom, siren}) => `${nom} (${siren})`)
    ?.join(", ") || "";

const ConsulterIndexResult: FC<ConsulterIndexResultProps> = ({ indicatorsData }) => (
  <table css={styles.table}>
    <thead>
      <tr>
        <HeaderCell>Raison Sociale</HeaderCell>
        <HeaderCell>SIREN</HeaderCell>
        <HeaderCell>Année</HeaderCell>
        <HeaderCell>Note</HeaderCell>
        <HeaderCell>Structure</HeaderCell>
        <HeaderCell>Nom UES</HeaderCell>
        <HeaderCell>Entreprises UES (SIREN)</HeaderCell>
        <HeaderCell>Région</HeaderCell>
        <HeaderCell>Département</HeaderCell>
      </tr>
    </thead>
    <tbody>
    {
      indicatorsData.map(({
        id,
        data: {
         informations,
         informationsEntreprise,
         declaration
        }
      }: FetchedIndicatorsData) => (
        <tr key={id}>
          <Cell>{informationsEntreprise.nomEntreprise}</Cell>
          <Cell>{informationsEntreprise.siren}</Cell>
          <Cell>{informations.anneeDeclaration}</Cell>
          <Cell>{declaration?.noteIndex || "NC"}</Cell>
          <Cell>{informationsEntreprise.structure}</Cell>
          <Cell>{informationsEntreprise.nomUES}</Cell>
          <Cell>{formatUESList(informationsEntreprise)}</Cell>
          <Cell>{informationsEntreprise.region}</Cell>
          <Cell>{informationsEntreprise.departement}</Cell>
        </tr>)
      )
    }
    </tbody>
  </table>
);

const padding = "10px";

const styles = {
  table: css({
    border: "1px solid black",
    borderCollapse: "collapse"
  }),
  headerCell: css({
    border: "1px solid black",
    padding
  }),
  cell: css({
    border: "1px solid black",
    padding
  })
};

export default ConsulterIndexResult;
