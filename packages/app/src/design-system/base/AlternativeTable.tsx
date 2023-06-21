"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { cx, type CxArg } from "@codegouvfr/react-dsfr/tools/cx";
import {
  type DetailedHTMLProps,
  type InputHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useState,
} from "react";

import styles from "./AlternativeTable.module.css";

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
  body: AlternativeTableProps.BodyContent[];
  classeName?: CxArg;
  footer?: AlternativeTableProps.Columns[];
  header: AlternativeTableProps.Columns[];
}

export namespace AlternativeTableProps {
  export interface Columns {
    data?: string;
    label: ReactNode;
    subCols?: Array<Omit<Columns, "subCols">>;
  }

  export interface BodyContent {
    categoryLabel: ReactNode;
    mergedLabel?: ReactNode;
    subRows?: [SubRow, ...SubRow[]];
  }

  type InputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
  type ColType = InputProps | ReactNode;
  export interface SubRow {
    cols?: [ColType, ...ColType[]];
    label: ReactNode;
    mergedLabel?: ReactNode;
  }
}

function validateProps(props: AlternativeTableProps) {
  const maxCols = props.header.reduce((prev, curr) => prev + (curr.subCols?.length ?? 1), 0);
  const footerCols = props.footer?.reduce((prev, curr) => prev + (curr.subCols?.length ?? 1), 0) ?? maxCols;

  // footer validation
  if (footerCols !== footerCols) {
    throw new Error("Should have the same amount of columns on header and footer.");
  }

  // body validation
  for (const row of props.body) {
    if (!row.subRows) {
      if (!row.mergedLabel)
        throw new Error(`For row {${row.categoryLabel}}, should either have columns or merged label.`);
    } else {
      for (const subRow of row.subRows) {
        // "-2" because we remove the count of categoryLabel and subRow label
        if ((subRow.cols?.length ?? 0) < maxCols - 2 && !subRow.mergedLabel) {
          throw new Error(
            `For subRow [{${row.categoryLabel}}->{${subRow.label}}], should either have the same amount of columns than header, or at least have merged labels.`,
          );
        }
      }
    }
  }

  return {
    maxCols,
    footerCols,
  };
}

export const AlternativeTable = (props: AlternativeTableProps) => {
  const { header, footer, body, classeName } = props;
  const [maxCols, setMaxCols] = useState<number>();

  useEffect(() => {
    const validated = validateProps(props);
    setMaxCols(validated.maxCols);
  }, [props]);

  if (!maxCols) {
    return null;
  }

  // const getLargestSubColsLength = (arr: AlternativeTableProps.Columns[]) => {
  //   let largestSubCols: unknown[] | string = [];

  //   arr.map(item => {
  //     if (item.subCols && Array.isArray(item.subCols) && item.subCols.length > largestSubCols.length) {
  //       largestSubCols = item.subCols;
  //     }
  //   });

  //   return largestSubCols.length;
  // };

  // const transformedColumnsData = (data: AlternativeTableProps.Columns[]) => {
  //   type RowType = Array<{
  //     colspan?: number;
  //     data?: string;
  //     label: ReactNode;
  //     rowspan?: number;
  //   }>;
  //   const firstRow: RowType = [];
  //   const secondRow: RowType = [];

  //   data.map(item => {
  //     if (item.subCols) {
  //       firstRow.push({ label: item.label, colspan: item.subCols.length, data: item.data });
  //       secondRow.push(...item.subCols.map(subItem => ({ label: subItem.label, data: subItem.data })));
  //     } else {
  //       firstRow.push({
  //         label: item.label,
  //         rowspan: getLargestSubColsLength(data),
  //         colspan: item.colspan,
  //         data: item.data,
  //       });
  //     }
  //   });

  //   return [firstRow, secondRow.flatMap(item => item)];
  // };

  // const transformedBodyData = (data: AlternativeTableProps.BodyContent[]) => {
  //   return data.map(item => {
  //     return item.subRows.map((subItem, index) => {
  //       if (index === 0) {
  //         return {
  //           categoryLabel: item.categoryLabel,
  //           label: subItem.label,
  //           cols: subItem.cols,
  //           colspan: item.colspan,
  //         };
  //       } else {
  //         return {
  //           label: subItem.label,
  //           cols: subItem.cols,
  //         };
  //       }
  //     });
  //   });
  // };

  return (
    <div className={cx(fr.cx("fr-table"), styles.table, classeName)}>
      <table>
        <thead>
          <tr>
            {header.map((headerCol, index) => (
              <AlternativeTableCell
                key={`th-top-${index}`}
                as="th"
                rowSpan={headerCol.subCols ? void 0 : 2}
                colSpan={headerCol.subCols?.length ?? void 0}
                scope={headerCol.subCols ? "colgroup" : "col"}
                align="center"
              >
                {headerCol.label}
              </AlternativeTableCell>
            ))}
          </tr>
          <tr>
            {header.map((headerCol, index) =>
              headerCol.subCols?.map((headerSubCol, subIndex) => (
                <AlternativeTableCell key={`th-bottom-${index}-${subIndex}`} as="th" scope="col" align="center">
                  {headerSubCol.label}
                </AlternativeTableCell>
              )),
            )}
          </tr>
        </thead>

        {body.map((row, index) => {
          return (
            <tbody key={index}>
              {row.subRows ? (
                row.subRows.map((subItem, j) => (
                  <AlternativeTableRow key={j}>
                    {j === 0 && (
                      <AlternativeTableCell as="th" rowSpan={4} scope="rowgroup">
                        {row.categoryLabel}
                      </AlternativeTableCell>
                    )}
                    <AlternativeTableCell as="th" scope="row">
                      {subItem.label}
                    </AlternativeTableCell>
                    {subItem.cols?.map((col, k) => (
                      <AlternativeTableCell key={k}>
                        <>{col}</>
                      </AlternativeTableCell>
                    ))}
                    {subItem.mergedLabel && (
                      <AlternativeTableCell colSpan={maxCols - 2 - (subItem.cols?.length ?? 0)}>
                        {subItem.mergedLabel}
                      </AlternativeTableCell>
                    )}
                  </AlternativeTableRow>
                ))
              ) : (
                <AlternativeTableRow>
                  <AlternativeTableCell as="th" scope="row">
                    {row.categoryLabel}
                  </AlternativeTableCell>
                  <AlternativeTableCell colSpan={maxCols - 1}>{row.mergedLabel}</AlternativeTableCell>
                </AlternativeTableRow>
              )}
            </tbody>
          );
        })}

        {/* {transformedBodyData(body).map((item, i) => {
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
        })} */}

        {/* {footer && (
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
        )} */}
      </table>
    </div>
  );
};
