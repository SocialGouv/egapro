/** @jsx jsx */
import {FC, useEffect} from "react";
import { css, jsx } from "@emotion/core";
import {FetchedIndicatorsData} from "./ConsulterIndex";
import {AppState} from "../../globals";
import {
  ColumnInstance,
  Row,
  TableHeaderProps,
  TableInstance,
  TableState,
  usePagination,
  UsePaginationInstanceProps,
  UsePaginationOptions,
  UsePaginationState,
  useSortBy,
  UseSortByColumnProps,
  UseSortByInstanceProps,
  UseSortByOptions,
  UseSortByState,
  useTable,
  UseTableOptions
} from "react-table";
import Pagination from "./Pagination";

export interface SortOption {
  field: string;
  order: "asc" | "desc"
}

interface ConsulterIndexResultProps {
  indicatorsData: FetchedIndicatorsData[];
  onPageChange: (index: number) => void;
  onSortByChange: (sortBy?: SortOption) => void;
  dataSize: number;
}

const formatUESList = (informationsEntreprise: AppState["informationsEntreprise"]) =>
  informationsEntreprise.entreprisesUES?.map(({ nom, siren}) => `${nom} (${siren})`)
    ?.join(", ") || "";

interface HeaderCellProps extends TableHeaderProps {
  column: AggregatedColumn
}

const HeaderCell: FC<HeaderCellProps> = ({ column }) => {
  let sortClass = [];
  if (column.canSort && !column.isSorted) {
    sortClass.push(styles.sortable);
  } else if (column.canSort && column.isSorted && column.isSortedDesc) {
    sortClass.push(styles.sortedDesc);
  } else if (column.canSort && column.isSorted && !column.isSortedDesc) {
    sortClass.push(styles.sortedAsc);
  }
  return (
    <th css={[styles.cell].concat(sortClass)}
        {...column.getHeaderProps(column.getSortByToggleProps)}
    >
      {column.render("Header")}
    </th>
  );
};

const columns = [{
    Header: "Raison\xa0Sociale",
    accessor: "data.informationsEntreprise.nomEntreprise"
  }, {
  Header: "SIREN",
  accessor: "data.informationsEntreprise.siren",
  disableSortBy: true
},{
  Header: "Année",
  accessor: "data.informations.anneeDeclaration",
  disableSortBy: true
},{
  Header: "Note",
  accessor: ({ data : { declaration } }: FetchedIndicatorsData) => (declaration?.noteIndex || "NC"),
  disableSortBy: true
},{
  Header: "Structure",
  accessor: "data.informationsEntreprise.structure",
  disableSortBy: true
}, {
  Header: "Nom UES",
  accessor: "data.informationsEntreprise.nomUES",
  disableSortBy: true
}, {
  Header: "Entreprises UES (SIREN)",
  accessor: (indicatorData: FetchedIndicatorsData) => formatUESList(indicatorData.data.informationsEntreprise),
  disableSortBy: true
},{
  Header: "Région",
  accessor: "data.informationsEntreprise.region",
  disableSortBy: true
},{
  Header: "Département",
  accessor: "data.informationsEntreprise.departement",
  disableSortBy: true
}];

const pageSize = 10;

type AggregatedUseTableOptions =
  & UseTableOptions<FetchedIndicatorsData>
  & UsePaginationOptions<FetchedIndicatorsData>
  & UseSortByOptions<FetchedIndicatorsData>;

type AggregatedTableInstance =
  & TableInstance<FetchedIndicatorsData>
  & UsePaginationInstanceProps<FetchedIndicatorsData>
  & UseSortByInstanceProps<FetchedIndicatorsData>;

type AggregatedTableState =
  & TableState<FetchedIndicatorsData>
  & UsePaginationState<FetchedIndicatorsData>
  & UseSortByState<FetchedIndicatorsData>;

type AggregatedColumn =
  & ColumnInstance<FetchedIndicatorsData>
  & UseSortByColumnProps<FetchedIndicatorsData>

const ConsulterIndexResult: FC<ConsulterIndexResultProps> = ({
   dataSize,
   indicatorsData ,
   onPageChange,
   onSortByChange
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
      disableMultiSort: true,
      manualPagination: true,
      manualSortBy: true,
      initialState: { pageSize },
      pageCount
    } as AggregatedUseTableOptions,
    useSortBy,
    usePagination
  ) as AggregatedTableInstance;

  const { pageIndex, sortBy } = state as AggregatedTableState;
  console.log(sortBy);

  useEffect(() => {
    onPageChange(pageIndex);
  }, [pageIndex, onPageChange]);

  useEffect(() => {
    const sortByElement = sortBy[0];
    if (sortByElement) {
      onSortByChange({
        field: sortByElement.id,
        order: sortByElement.desc ? "desc" : "asc"
      });
    } else {
      onSortByChange();
    }
  }, [sortBy, onSortByChange]);

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
          {(headerGroups[0].headers as AggregatedColumn[]).map((column) => (
            <HeaderCell key={column.getHeaderProps().key} column={column} />
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
  }),
  sortable: css`
    :after {
      content: "\\2195";
      padding-left: 6px;
    }
  `,
  sortedAsc: css`
    :after {
      content: "\\2191";
      padding-left: 6px;
    }
  `,
  sortedDesc: css`
    :after {
      content: "\\2193";
      padding-left: 6px;
    }
  `
};

export default ConsulterIndexResult;
