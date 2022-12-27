import type { PropsWithChildren, ThHTMLAttributes } from "react";

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
  colSpan?: number;
  onClick?: ThHTMLAttributes<HTMLTableHeaderCellElement>["onClick"];
  order?: "asc" | "desc" | false;
}
export const TableAdminHeadCol = ({ children, colSpan, order, onClick }: PropsWithChildren<TableAdminHeadColProps>) => (
  <th className={style.tableHeadCol} scope="col" colSpan={colSpan} onClick={onClick}>
    {children}
    {order && <span>{order === "asc" ? "⬆" : "⬇"}</span>}
  </th>
);

export const TableAdminBody = ({ children }: PropsWithChildren) => <tbody>{children}</tbody>;

export const TableAdminBodyRow = ({ children }: PropsWithChildren) => (
  <tr className={style.tableBodyRow}>{children}</tr>
);

export const TableAdminBodyRowCol = ({ children }: PropsWithChildren) => (
  <td className={style.tableBodyRowCol}>{children}</td>
);
