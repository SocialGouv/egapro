import type { PropsWithChildren } from "react";

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

export const TableAdminHeadCol = ({
  children,
  colSpan,
}: PropsWithChildren<{
  colSpan?: number;
}>) => (
  <th className={style.tableHeadCol} scope="col" colSpan={colSpan}>
    {children}
  </th>
);

export const TableAdminBody = ({ children }: PropsWithChildren) => <tbody>{children}</tbody>;

export const TableAdminBodyRow = ({ children }: PropsWithChildren) => (
  <tr className={style.tableBodyRow}>{children}</tr>
);

export const TableAdminBodyRowCol = ({ children }: PropsWithChildren) => (
  <td className={style.tableBodyRowCol}>{children}</td>
);
