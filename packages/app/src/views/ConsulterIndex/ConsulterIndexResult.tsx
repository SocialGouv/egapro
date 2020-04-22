/** @jsx jsx */
import { FC, useEffect, useMemo } from "react";
import { css, jsx } from "@emotion/core";
import { FetchedIndicatorsData } from "./ConsulterIndex";
import { AppState } from "../../globals";
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
import Subtitle from "../../components/MinistereTravail/Subtitle";

export interface SortOption {
  field: string;
  order: "asc" | "desc";
}

const formatUESList = (
  informationsEntreprise: AppState["informationsEntreprise"]
) =>
  informationsEntreprise.entreprisesUES
    ? informationsEntreprise.entreprisesUES
        .map(({ nom, siren }) => `${nom} (${siren})`)
        .join(", ")
    : "";

interface HeaderCellProps extends TableHeaderProps {
  column: AggregatedColumn;
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
    <th
      css={[styles.cell].concat(sortClass)}
      {...column.getHeaderProps(column.getSortByToggleProps)}
    >
      {column.render("Header")}
    </th>
  );
};

// Highlighting is done in the front-end because elastic search highlighting with ngram tokens is buggy.
const highlightText = (text: string, highlightedTerm: string, key: string): (string|JSX.Element)[] => {
  // Replacing characters with accents by all the possibilities in a regex
  // Ex: highlightText("élément", "el", "key")
  // <em>él</em>ement
  const rawRegexWithAccent = highlightedTerm
    .replace(/[eéèë]/gi, "[eéèë]")
    .replace(/[iï]/gi, "[iï]")
    .replace(/[aà]/gi, "[aà]")
    .replace(/[cç]/gi, "[cç]");

  // We generate a regex that match the searched characters
  const regex = new RegExp(rawRegexWithAccent, "gi");

  // We get all the samples that match the regex
  const matches = text.match(regex) || [];

  // We split the string to get only the unsearched parts.
  const splitText = text.split(regex);

  // We aggregate the matched and unmatched samples
  // ex:
  // text = "element"
  // searchTerm = "em"
  //
  // matches = ["em"] splitText = ["el", "ent"].
  // we return ["el", <em>em</em>, "ent"]
  return splitText.reduce(
    (acc, textChunk, index) =>
      index < splitText.length - 1 ?
        acc.concat([textChunk, <em css={styles.highlight} key={`${key}-${index}`}>{matches[index]}</em>]) :
        acc.concat([textChunk]),
    [] as (string|JSX.Element)[]);
};

const makeColumns = (searchedTerm: string) => ([
  {
    id: "data.informationsEntreprise.nomEntreprise",
    Header: "Raison\xa0Sociale",
    accessor: ({
        data: {
          informationsEntreprise: {
            nomEntreprise
          }
        }
      }: FetchedIndicatorsData,
      index: number,
    ) => (
      <span>
        {
          highlightText(nomEntreprise, searchedTerm, `raison-sociale-${index}`)
        }
      </span>
    )
  },
  {
    Header: "SIREN",
    accessor: "data.informationsEntreprise.siren",
    disableSortBy: true
  },
  {
    Header: "Année",
    accessor: "data.informations.anneeDeclaration",
    disableSortBy: true
  },
  {
    Header: "Note",
    accessor: ({ data: { declaration } }: FetchedIndicatorsData) =>
      (declaration && declaration.noteIndex) || "NC",
    disableSortBy: true
  },
  {
    Header: "Structure",
    accessor: "data.informationsEntreprise.structure",
    disableSortBy: true
  },
  {
    Header: "Nom UES",
    accessor: "data.informationsEntreprise.nomUES",
    disableSortBy: true
  },
  {
    Header: "Entreprises UES (SIREN)",
    accessor: (indicatorData: FetchedIndicatorsData) =>
      formatUESList(indicatorData.data.informationsEntreprise),
    disableSortBy: true
  },
  {
    Header: "Région",
    accessor: "data.informationsEntreprise.region",
    disableSortBy: true
  },
  {
    Header: "Département",
    accessor: "data.informationsEntreprise.departement",
    disableSortBy: true
  }
]);

const pageSize = 10;

type AggregatedUseTableOptions = UseTableOptions<FetchedIndicatorsData> &
  UsePaginationOptions<FetchedIndicatorsData> &
  UseSortByOptions<FetchedIndicatorsData>;

type AggregatedTableInstance = TableInstance<FetchedIndicatorsData> &
  UsePaginationInstanceProps<FetchedIndicatorsData> &
  UseSortByInstanceProps<FetchedIndicatorsData>;

type AggregatedTableState = TableState<FetchedIndicatorsData> &
  UsePaginationState<FetchedIndicatorsData> &
  UseSortByState<FetchedIndicatorsData>;

type AggregatedColumn = ColumnInstance<FetchedIndicatorsData> &
  UseSortByColumnProps<FetchedIndicatorsData>;

interface ConsulterIndexResultProps {
  currentPage: number;
  dataSize: number;
  indicatorsData: FetchedIndicatorsData[];
  searchTerm: string;
  onPageChange: (index: number) => void;
  onSortByChange: (sortBy?: SortOption) => void;
}

const ConsulterIndexResult: FC<ConsulterIndexResultProps> = ({
  currentPage,
  dataSize,
  indicatorsData,
  searchTerm,
  onPageChange,
  onSortByChange
}) => {
  const pageCount = Math.floor((dataSize - 1) / pageSize) + 1;
  const columns = useMemo(() => makeColumns(searchTerm), [searchTerm]);
  const {
    getTableProps,
    getTableBodyProps,
    gotoPage,
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
      initialState: {
        pageSize
      },
      pageCount
    } as AggregatedUseTableOptions,
    useSortBy,
    usePagination
  ) as AggregatedTableInstance;

  const { pageIndex, sortBy } = state as AggregatedTableState;

  useEffect(() => {
    onPageChange(pageIndex);
  }, [pageIndex, onPageChange]);

  useEffect(() => {
    gotoPage(currentPage);
  }, [currentPage, gotoPage]);

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
        pageIndex={currentPage}
        pageCount={pageCount}
        previousPage={previousPage}
        nextPage={nextPage}
      />
      <table {...getTableProps()} css={styles.table}>
        <thead css={styles.header}>
          <tr>
            {(headerGroups[0].headers as AggregatedColumn[]).map(column => (
              <HeaderCell key={column.getHeaderProps().key} column={column} />
            ))}
          </tr>
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row: Row<FetchedIndicatorsData>) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} css={styles.row}>
                {row.cells.map(cell => (
                  <td data-title={cell.column.Header} css={styles.cell} {...cell.getCellProps()}>
                    {cell.render("Cell")}
                    {console.log(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pagination
        pageIndex={currentPage}
        pageCount={pageCount}
        previousPage={previousPage}
        nextPage={nextPage}
      />
      <div>
        <Subtitle>NC = Non Calculable</Subtitle>
        <Subtitle>
          A noter : la note pour l’année 2019 peut ne pas être disponible à date
          pour les raisons suivantes : changement d’effectif de l’entreprise
          recherchée, index non transmis, vérifications en cours
        </Subtitle>
      </div>
    </div>
  );
};

const padding = "10px";
const border =  "1px solid black";

const smallScreenMediaQuery = "@media only screen and (max-width: 950px)";

const styles = {
  table: css({
    border,
    borderCollapse: "collapse",
    width: "100%",
    [smallScreenMediaQuery]: {
      display: "block"
    }
  }),
  header: css({
    [smallScreenMediaQuery]: {
      display: "block",
      position: "fixed",
      top: "-9999px",
      left: "-9999px"
    },
  }),
  headerCell: css({
    border,
    padding,
    [smallScreenMediaQuery]: {
      display: "block",
    },
  }),
  cell: css({
    border,
    padding,
    [smallScreenMediaQuery]: {
      display: "block",
      border: "none",
      ":before": {
        content: "attr(data-title)",
        fontWeight: "bold",
        paddingRight: "10px"
      }
    }
  }),
  row: css({
    [smallScreenMediaQuery]: {
      display: "block",
      border
    }
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
  `,
  highlight: css({
    fontWeight: "bold",
    fontStyle: "normal"
  })
};

export default ConsulterIndexResult;
