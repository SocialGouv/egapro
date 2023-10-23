"use client";

import { type OrderableColumn } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { TableAdminHeadCol, type TableAdminHeadColProps } from "@design-system";
import { useRouter } from "next/navigation";

interface TableAdminHeadColClientProps extends Omit<TableAdminHeadColProps, "onClick" | "orderDirection"> {
  columnLabel: string;
  columnValue: OrderableColumn | "ues";
  currentOrderBy: OrderableColumn;
  currentOrderDirection: "asc" | "desc";
}

export const TableAdminHeadColClient = ({
  columnValue,
  columnLabel,
  currentOrderBy,
  currentOrderDirection,
  ...rest
}: TableAdminHeadColClientProps) => {
  const router = useRouter();
  return (
    <TableAdminHeadCol
      {...rest}
      orderDirection={currentOrderBy === columnValue && currentOrderDirection}
      onClick={() => {
        if (columnValue === "ues") return;
        let orderDirection = currentOrderDirection;
        let orderBy = currentOrderBy;
        if (currentOrderBy === columnValue) {
          orderDirection = orderDirection === "asc" ? "desc" : "asc";
        } else {
          orderBy = columnValue;
          orderDirection = "desc";
        }

        // change url parameters
        const url = new URL(location.href);
        url.searchParams.set("orderBy", orderBy);
        url.searchParams.set("orderDirection", orderDirection);

        router.replace(url.toString(), { scroll: false });
      }}
    >
      {columnLabel}
    </TableAdminHeadCol>
  );
};
