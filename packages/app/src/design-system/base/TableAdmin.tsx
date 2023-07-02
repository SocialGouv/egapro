import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { type PropsWithChildren } from "react";
import { forwardRef } from "react";

import style from "./TableAdmin.module.css";

export const TableAdmin = ({ children }: PropsWithChildren) => (
  <div className={style.table}>
    <table>{children}</table>
  </div>
);

export const TableAdminHead = ({ children }: PropsWithChildren) => (
  <thead className={style.tableHead}>
    <tr>{children}</tr>
  </thead>
);

export interface TableAdminHeadColProps {
  colSpan?: JSX.IntrinsicElements["td"]["colSpan"];
  onClick?: JSX.IntrinsicElements["th"]["onClick"];
  orderDirection?: "asc" | "desc" | false;
}
export const TableAdminHeadCol = ({
  children,
  colSpan,
  orderDirection,
  onClick,
}: PropsWithChildren<TableAdminHeadColProps>) => (
  <th
    className={cx(style.tableHeadCol, onClick && style.tableHeadColClickable)}
    scope="col"
    colSpan={colSpan}
    onClick={onClick}
  >
    {children}
    {orderDirection && <span>{orderDirection === "asc" ? "⬆" : "⬇"}</span>}
  </th>
);

export const TableAdminBody = forwardRef<HTMLTableSectionElement, PropsWithChildren>(({ children }, ref) => (
  <tbody ref={ref}>{children}</tbody>
));
TableAdminBody.displayName = "TableAdminBody";

export const TableAdminBodyRow = ({ children }: PropsWithChildren) => (
  <tr className={style.tableBodyRow}>{children}</tr>
);

export const TableAdminBodyRowCol = ({ children, ...rest }: JSX.IntrinsicElements["td"]) => (
  <td {...rest} className={style.tableBodyRowCol}>
    {children}
  </td>
);
