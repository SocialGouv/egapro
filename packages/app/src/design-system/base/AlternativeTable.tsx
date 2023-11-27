import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input, { type InputProps } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { type TableProps } from "@codegouvfr/react-dsfr/Table";
import { cx, type CxArg } from "@codegouvfr/react-dsfr/tools/cx";
import { ClientBodyPortal } from "@components/utils/ClientBodyPortal";
import { ERROR_TOOLTIP_ID, TooltipWrapper } from "@components/utils/TooltipWrapper";
import { type PropsWithChildren, type ReactNode, useId } from "react";

import styles from "./AlternativeTable.module.css";

type TableHeaderScope = "col" | "colgroup" | "row" | "rowgroup";
type TableCellAlign = "center" | "left" | "right";

export type AlternativeTableCellProps = PropsWithChildren & {
  align?: TableCellAlign;
  as?: `t${"d" | "h"}`;
  colSpan?: number;
  informations?: ReactNode;
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
  informations,
}: AlternativeTableCellProps) => {
  const id = useId();
  const modal = informations
    ? createModal({
        id: `modal-${id}`,
        isOpenedByDefault: false,
      })
    : null;
  return (
    <HtmlTag
      className={cx(
        styles["table-cell"],
        informations ? styles["table-cell--with-informations"] : undefined,
        align === "center" && styles["text-align--center"],
        align === "right" && styles["text-align--right"],
      )}
      scope={scope}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      <div>{children}</div>
      {informations && (
        <>
          <Button
            nativeButtonProps={{
              ...modal?.buttonProps,
              type: "button",
            }}
            size="small"
            iconId="fr-icon-information-fill"
            priority="tertiary"
            title="Plus d'informations"
            className={styles["modal-button"]}
          />

          {modal && (
            <ClientBodyPortal>
              <modal.Component title={children} className={styles.modal}>
                {informations}
              </modal.Component>
            </ClientBodyPortal>
          )}
        </>
      )}
    </HtmlTag>
  );
};

export type AlternativeTableProps = Pick<TableProps, "bordered"> & {
  body: AlternativeTableProps.BodyContent[];
  classeName?: CxArg;
  footer?: AlternativeTableProps.ColumnsFooter[];
  header: AlternativeTableProps.Columns[];
};

export namespace AlternativeTableProps {
  export interface Columns {
    informations?: ReactNode;
    label: ReactNode;
    subCols?: Array<Omit<Columns, "subCols">>;
  }

  export interface ColumnsFooter {
    align?: TableCellAlign;
    colspan?: number;
    data?: ReactNode;
    label: ReactNode;
  }

  export type BodyContent = BodyContentBase & (BodyContentWithCols | BodyContentWithSubRows);
  interface BodyContentBase {
    categoryLabel: ReactNode;
    isDeletable?: boolean;
    key?: string;
    mergedLabel?: ReactNode;
    onClickDelete?: () => void;
  }

  interface BodyContentWithCols {
    /**
     * @default "right"
     */
    alignCols?: "center" | "left" | "right";
    cols?: [ColType, ...ColType[]];
    subRows?: never;
  }

  interface BodyContentWithSubRows {
    alignCols?: never;
    cols?: never;
    subRows?: [SubRow, ...SubRow[]];
  }

  export type CellInputProps = Omit<
    InputProps,
    | "classes"
    | "className"
    | "hideLabel"
    | "hintText"
    | "iconId"
    | "nativeInputProps"
    | "nativeTextAreaProps"
    | "style"
    | "textArea"
  > &
    Required<Pick<InputProps, "nativeInputProps">>;
  export type ColType = CellInputProps | number | string;
  export interface SubRow {
    /**
     * @default "right"
     */
    alignCols?: "center" | "left" | "right";
    cols?: [ColType, ...ColType[]];
    label: ReactNode;
    mergedLabel?: ReactNode;
  }
}

function validateProps(props: AlternativeTableProps) {
  const maxCols = props.header.reduce((prev, curr) => prev + (curr.subCols?.length ?? 1), 0);
  // body validation
  for (const row of props.body) {
    if (!row.subRows) {
      if (!row.cols) {
        if (!row.mergedLabel)
          throw new Error(`For row {${row.categoryLabel}}, should either have columns or merged label.`);
      } else {
        // "-1" because we remove the count of categoryLabel
        if (row.cols.length < maxCols - 1) {
          throw new Error(
            `For row {${row.categoryLabel}}, should either have the same amount of columns than header, or at least have merged labels.`,
          );
        }
      }
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
  };
}

function isDsfrInputProps(props: AlternativeTableProps.ColType): props is AlternativeTableProps.CellInputProps {
  return (props as AlternativeTableProps.CellInputProps).nativeInputProps !== undefined;
}

export const AlternativeTable = (props: AlternativeTableProps) => {
  const { header, footer, body, classeName, bordered } = props;

  const validated = validateProps(props);
  const maxCols = validated.maxCols;

  if (!maxCols) {
    return null;
  }

  return (
    <div
      className={cx(
        fr.cx("fr-table", {
          "fr-table--bordered": bordered,
        }),
        styles.table,
        classeName,
      )}
    >
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
                informations={headerCol.informations}
              >
                {headerCol.label}
              </AlternativeTableCell>
            ))}
          </tr>
          <tr>
            {header.map(
              (headerCol, index) =>
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
            <tbody key={row.key || index}>
              {row.subRows ? (
                row.subRows.map((subItem, j) => (
                  <tr key={`${row.key || index}-${j}`}>
                    {j === 0 && (
                      <AlternativeTableCell as="th" rowSpan={4} scope="rowgroup">
                        <span>{row.categoryLabel}</span>
                        {row.isDeletable && (
                          <Button
                            iconId="fr-icon-delete-fill"
                            priority="tertiary"
                            title="Label button"
                            className={styles["delete-btn"]}
                            size="small"
                            type="button"
                            onClick={row.onClickDelete}
                          >
                            Supprimer
                          </Button>
                        )}
                      </AlternativeTableCell>
                    )}
                    <AlternativeTableCell as="th" scope="row">
                      {subItem.label}
                    </AlternativeTableCell>
                    {subItem.cols?.map((col, k) => (
                      <AlternativeTableCell key={`${row.key || index}-${j}-${k}`} align={row.alignCols ?? "right"}>
                        {isDsfrInputProps(col) ? (
                          <TooltipWrapper id={ERROR_TOOLTIP_ID} message={col?.stateRelatedMessage?.toString()}>
                            <Input {...col} hideLabel classes={{ message: "fr-sr-only" }} textArea={false} />
                          </TooltipWrapper>
                        ) : (
                          col
                        )}
                      </AlternativeTableCell>
                    ))}
                    {subItem.mergedLabel && (
                      <AlternativeTableCell colSpan={maxCols - 2 - (subItem.cols?.length ?? 0)} align="center">
                        <i className={cx(fr.cx("fr-text--xs"))}>{subItem.mergedLabel}</i>
                      </AlternativeTableCell>
                    )}
                  </tr>
                ))
              ) : row.cols ? (
                <tr>
                  <AlternativeTableCell as="th">{row.categoryLabel}</AlternativeTableCell>
                  {row.cols.map((col, k) => (
                    <AlternativeTableCell key={`${row.key || index}-${k}`} align={row.alignCols ?? "right"}>
                      {isDsfrInputProps(col) ? (
                        <TooltipWrapper id={ERROR_TOOLTIP_ID} message={col?.stateRelatedMessage?.toString()}>
                          <Input {...col} hideLabel classes={{ message: "fr-sr-only" }} textArea={false} />
                        </TooltipWrapper>
                      ) : (
                        col
                      )}
                    </AlternativeTableCell>
                  ))}
                  {row.mergedLabel && (
                    <AlternativeTableCell colSpan={maxCols - 1 - (row.cols?.length ?? 0)} align="center">
                      <i className={cx(fr.cx("fr-text--xs"))}>{row.mergedLabel}</i>
                    </AlternativeTableCell>
                  )}
                </tr>
              ) : (
                <tr>
                  <AlternativeTableCell as="th" scope="rowgroup">
                    {row.categoryLabel}
                  </AlternativeTableCell>
                  <AlternativeTableCell colSpan={maxCols - 1} align="center">
                    <i className={cx(fr.cx("fr-text--xs"))}>{row.mergedLabel}</i>
                  </AlternativeTableCell>
                </tr>
              )}
            </tbody>
          );
        })}

        {footer && (
          <tfoot>
            <tr>
              {footer.map((footerCol, index) => (
                <AlternativeTableCell
                  key={`td-footer-${index}`}
                  colSpan={footerCol.colspan}
                  align={footerCol.align ?? "center"}
                >
                  <span className={cx(fr.cx(typeof footerCol.data !== "undefined" ? "fr-text--xs" : null))}>
                    {footerCol.label}
                  </span>
                  {typeof footerCol.data !== "undefined" && (
                    <>
                      <br />
                      <strong>{footerCol.data}</strong>
                    </>
                  )}
                </AlternativeTableCell>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};
