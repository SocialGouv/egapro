"use client";

import { type OrderableColumn } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { TableAdminHeadCol, type TableAdminHeadColProps } from "@design-system";

interface TableAdminHeadColClientProps extends Omit<TableAdminHeadColProps, "onClick"> {
  columnLabel: string;
  columnValue: OrderableColumn | "ues";
}

export const TableAdminHeadColClient = ({ columnValue, columnLabel, ...rest }: TableAdminHeadColClientProps) => {
  return <TableAdminHeadCol {...rest}>{columnLabel}</TableAdminHeadCol>;
};
