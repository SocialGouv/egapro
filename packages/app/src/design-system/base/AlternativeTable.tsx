"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type DetailedHTMLProps, type InputHTMLAttributes, type PropsWithChildren, type ReactNode } from "react";

import styles from "./AlternativeTable.module.css";
import { Text } from "./Typography";

type TableHeaderScope = "col" | "colgroup" | "row" | "rowgroup";

export type AlternativeTableCellProps = PropsWithChildren & {
  align?: "center" | "left" | "right";
  as?: `t${"d" | "h"}`;
  colSpan?: number;
  rowSpan?: number;
  scope?: TableHeaderScope;
};

export const AlternativeTableCell = ({
  as: HtmlTag = "td",
  align = "left",
  scope,
  colSpan,
  rowSpan,
  children,
}: AlternativeTableCellProps) => (
  <HtmlTag
    className={cx(align === "center" && styles["text-align--center"], align === "right" && styles["text-align--right"])}
    scope={scope}
    colSpan={colSpan}
    rowSpan={rowSpan}
  >
    {children}
  </HtmlTag>
);

export const AlternativeTableRow = ({ children }: PropsWithChildren) => <tr>{children}</tr>;

export interface AlternativeTableProps {
  body: AlternativeTableProps.Body[];
  classeName?: string;
  footer?: AlternativeTableProps.Columns[];
  header: AlternativeTableProps.Columns[];
}

export namespace AlternativeTableProps {
  export interface Columns {
    colspan?: number;
    data?: string;
    label: ReactNode;
    subCols?: Array<Omit<Columns, "subCols">>;
  }

  export interface Body {
    categoryLabel: string;
    colspan?: number;
    subRows: [SubRow, ...SubRow[]];
  }

  type InputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
  type ColType = InputProps | ReactNode;
  export interface SubRow {
    cols: [ColType, ...ColType[]];
    label: string;
    mergedLabel?: ReactNode;
  }
}

export const AlternativeTable = ({ header, footer, body, classeName }: AlternativeTableProps) => {
  const getLargestSubColsLength = (arr: AlternativeTableProps.Columns[]) => {
    let largestSubCols: unknown[] | string = [];

    arr.map(item => {
      if (item.subCols && Array.isArray(item.subCols) && item.subCols.length > largestSubCols.length) {
        largestSubCols = item.subCols;
      }
    });

    return largestSubCols.length;
  };

  const transformedColumnsData = (data: AlternativeTableProps.Columns[]) => {
    type RowType = Array<{
      colspan?: number;
      data?: string;
      label: ReactNode;
      rowspan?: number;
    }>;
    const firstRow: RowType = [];
    const secondRow: RowType = [];

    data.map(item => {
      if (item.subCols) {
        firstRow.push({ label: item.label, colspan: item.subCols.length, data: item.data });
        secondRow.push(...item.subCols.map(subItem => ({ label: subItem.label, data: subItem.data })));
      } else {
        firstRow.push({
          label: item.label,
          rowspan: getLargestSubColsLength(data),
          colspan: item.colspan,
          data: item.data,
        });
      }
    });

    return [firstRow, secondRow.flatMap(item => item)];
  };

  const transformedBodyData = (data: AlternativeTableProps.Body[]) => {
    return data.map(item => {
      return item.subRows.map((subItem, index) => {
        if (index === 0) {
          return {
            categoryLabel: item.categoryLabel,
            label: subItem.label,
            cols: subItem.cols,
            colspan: item.colspan,
          };
        } else {
          return {
            label: subItem.label,
            cols: subItem.cols,
          };
        }
      });
    });
  };

  return (
    <div className={cx(fr.cx("fr-table"), styles.table, classeName)}>
      <table>
        <thead>
          {transformedColumnsData(header).map((row, index) => (
            <AlternativeTableRow key={index}>
              {row.map((item, index) => (
                <AlternativeTableCell
                  key={index}
                  align="center"
                  scope="col"
                  as="th"
                  rowSpan={item.rowspan}
                  colSpan={item.colspan}
                >
                  {item.label}
                </AlternativeTableCell>
              ))}
            </AlternativeTableRow>
          ))}
        </thead>

        {transformedBodyData(body).map((item, i) => {
          return (
            <tbody key={i}>
              {item.map((subItem, j) => (
                <AlternativeTableRow key={j}>
                  {subItem.categoryLabel && (
                    <AlternativeTableCell as="th" rowSpan={4} scope="rowgroup">
                      {subItem.categoryLabel}
                    </AlternativeTableCell>
                  )}
                  <AlternativeTableCell as="th" scope="row" colSpan={subItem.colspan}>
                    {subItem.label}
                  </AlternativeTableCell>
                  {subItem.cols.map((col, k) => (
                    <AlternativeTableCell key={k}>
                      <>{col}</>
                    </AlternativeTableCell>
                  ))}
                </AlternativeTableRow>
              ))}
            </tbody>
          );
        })}

        {footer && (
          <tfoot>
            {transformedColumnsData(footer).map((row, index) => (
              <AlternativeTableRow key={index}>
                {row.map((item, index) => (
                  <AlternativeTableCell
                    key={index}
                    align="center"
                    scope="col"
                    as="td"
                    rowSpan={item.rowspan}
                    colSpan={item.colspan}
                  >
                    <>
                      <Text text={item.label} inline className={cx(item.data && "fr-text--xs")} />
                      {item.data && (
                        <>
                          <br />
                          <strong>{item.data}</strong>
                        </>
                      )}
                    </>
                  </AlternativeTableCell>
                ))}
              </AlternativeTableRow>
            ))}
          </tfoot>
        )}
      </table>
    </div>
  );
};
