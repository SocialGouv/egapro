/** @jsx jsx */
import {FC, useEffect} from "react";
import { css, jsx } from "@emotion/core";
import {FetchedIndicatorsData} from "./ConsulterIndex";
import {AppState} from "../../globals";
import {
  ColumnInstance,
  Row,
  TableInstance,
  usePagination,
  UsePaginationInstanceProps,
  UsePaginationOptions,
  UsePaginationState,
  useTable,
  UseTableOptions
} from "react-table";
import Pagination from "./Pagination";

interface ConsulterIndexResultProps {
  indicatorsData: FetchedIndicatorsData[];
  onPageChange: (index: number) => void;
  dataSize: number;
}

const formatUESList = (informationsEntreprise: AppState["informationsEntreprise"]) =>
  informationsEntreprise.entreprisesUES?.map(({ nom, siren}) => `${nom} (${siren})`)
    ?.join(", ") || "";

const columns = [{
    Header: "Raison Sociale",
    accessor: "data.informationsEntreprise.nomEntreprise"
  }, {
  Header: "SIREN",
  accessor: "data.informationsEntreprise.siren"
},{
  Header: "Année",
  accessor: "data.informations.anneeDeclaration"
},{
  Header: "Note",
  accessor: ({ data : { declaration } }: FetchedIndicatorsData) => (declaration?.noteIndex || "NC")
},{
  Header: "Structure",
  accessor: "data.informationsEntreprise.structure"
}, {
  Header: "Nom UES",
  accessor: "data.informationsEntreprise.nomUES"
}, {
  Header: "Entreprises UES (SIREN)",
  accessor: (indicatorData: FetchedIndicatorsData) => formatUESList(indicatorData.data.informationsEntreprise)
},{
  Header: "Région",
  accessor: "data.informationsEntreprise.region"
},{
  Header: "Département",
  accessor: "data.informationsEntreprise.departement"
}];

const pageSize = 10;

const ConsulterIndexResult: FC<ConsulterIndexResultProps> = ({
   dataSize,
   indicatorsData ,
   onPageChange
}) => {
  const pageCount = Math.floor((dataSize - 1) / pageSize) + 1;
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    nextPage,
    page,
    prepareRow,
    previousPage,
    state
  } = useTable(
    {
      columns,
      data: indicatorsData,
      manualPagination: true,
      initialState: { pageSize },
      pageCount
    } as UseTableOptions<FetchedIndicatorsData> & UsePaginationOptions<FetchedIndicatorsData>,
    usePagination
  ) as TableInstance<FetchedIndicatorsData> & UsePaginationInstanceProps<FetchedIndicatorsData>;

  const { pageIndex } = state as UsePaginationState<FetchedIndicatorsData>;

  useEffect(() => {
    onPageChange(pageIndex);
  }, [pageIndex, onPageChange])

  return (
    <div>
      <Pagination
        pageIndex={pageIndex}
        pageCount={pageCount}
        previousPage={previousPage}
        nextPage={nextPage}
      />
      <table {...getTableProps()} css={styles.table}>
        <thead>
        <tr>
          {headerGroups[0].headers.map((column: ColumnInstance<FetchedIndicatorsData>) => (
            <th css={styles.cell} {...column.getHeaderProps()}>{column.Header}</th>
          ))}
        </tr>
        </thead>
        <tbody {...getTableBodyProps()}>
        {
          page.map((row: Row<FetchedIndicatorsData>) => {
            prepareRow(row);
            return (<tr {...row.getRowProps()}>
              {row.cells.map(cell => <td css={styles.cell} {...cell.getCellProps()}>
                {cell.render("Cell")}
              </td>)}
            </tr>)}
          )
        }
        </tbody>
      </table>
      <Pagination
        pageIndex={pageIndex}
        pageCount={pageCount}
        previousPage={previousPage}
        nextPage={nextPage}
      />
    </div>
  );
};

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
