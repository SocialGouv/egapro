import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type PropsWithChildren, type ReactNode } from "react";

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

export type AlternativeTableProps = {
  body?: ReactNode[];
  classeName?: string;
  footer?: ReactNode;
  header?: ReactNode;
};

export const AlternativeTable = ({ header, footer, body, classeName }: AlternativeTableProps) => (
  <div className={cx(fr.cx("fr-table"), styles.table, classeName)}>
    <table>
      {header !== undefined && <thead>{header}</thead>}
      {body !== undefined && body.map((body, i) => <tbody key={i}>{body}</tbody>)}
      {footer !== undefined && <tfoot>{footer}</tfoot>}
    </table>
  </div>
);
