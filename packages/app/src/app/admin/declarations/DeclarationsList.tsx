"use client";

import Badge from "@codegouvfr/react-dsfr/Badge";
import { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import {
  type AdminDeclarationDTO,
  columnMap,
  type OrderableColumn,
} from "@common/core-domain/dtos/AdminDeclarationDTO";
import { type SearchAdminDeclarationDTO } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { formatDateToFr } from "@common/utils/date";
import { Object } from "@common/utils/overload";
import {
  Box,
  TableAdmin,
  TableAdminBody,
  TableAdminBodyRow,
  TableAdminBodyRowCol,
  TableAdminHead,
  TableAdminHeadCol,
} from "@design-system";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { deleteAdminDeclarations } from "./actions";
import style from "./style.module.scss";

const getId = (declaration: AdminDeclarationDTO) => `${declaration.type}-${declaration.siren}-${declaration.year}`;

export interface DeclarationsListProps {
  data: AdminDeclarationDTO[];
  limit: SearchAdminDeclarationDTO["limit"];
  orderBy: SearchAdminDeclarationDTO["orderBy"];
  orderDirection: SearchAdminDeclarationDTO["orderDirection"];
}

enum CheckAllState {
  Checked = "checked",
  Indeterminate = "indeterminate",
  Unchecked = "unchecked",
}

const limits = [10, 50, 100] as const;

export const DeclarationsList = ({ data, orderBy, orderDirection, limit: currentLimit }: DeclarationsListProps) => {
  const router = useRouter();
  const [checkedRows, setCheckedRows] = useState<string[]>([]);
  const [checkedAll, setCheckedAll] = useState<CheckAllState>(CheckAllState.Unchecked);
  const checkAllRef = useRef<HTMLInputElement>(null);
  const [tableBodyParent] = useAutoAnimate<HTMLTableSectionElement>();

  const onClickHeadCol = (
    columnValue: OrderableColumn | "ues",
    currentOrderDirection: DeclarationsListProps["orderDirection"],
    currentOrderBy: DeclarationsListProps["orderBy"],
  ) => {
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
  };

  const doCheckAll = (checkAll: boolean) => {
    if (checkAll) {
      setCheckedRows(data.map(getId));
      setCheckedAll(CheckAllState.Checked);
    } else {
      setCheckedRows([]);
      setCheckedAll(CheckAllState.Unchecked);
    }
  };

  const switchIndeterminate = (value: boolean) => {
    if (checkAllRef.current) {
      checkAllRef.current.indeterminate = value;
    }
  };

  const doCheckRow = (id: string, checked: boolean) => {
    if (checked) {
      const newRows = [...new Set(checkedRows).add(id)];
      setCheckedRows(newRows);
      if (newRows.length === data.length) {
        switchIndeterminate(false);
        setCheckedAll(CheckAllState.Checked);
      } else {
        setCheckedAll(CheckAllState.Indeterminate);
        switchIndeterminate(true);
      }
    } else {
      const newRows = checkedRows.filter(rowId => rowId !== id);
      setCheckedRows(newRows);
      if (newRows.length === 0) {
        switchIndeterminate(false);
        setCheckedAll(CheckAllState.Unchecked);
      } else {
        setCheckedAll(CheckAllState.Indeterminate);
        switchIndeterminate(true);
      }
    }
  };

  return (
    <>
      <Box className="flex justify-between">
        <ButtonsGroup
          inlineLayoutWhen="always"
          buttonsSize="small"
          alignment="left"
          buttons={[
            {
              children: "Supprimer",
              priority: "secondary",
              type: "button",
              nativeButtonProps: {
                disabled: checkedRows.length === 0,
                async onClick() {
                  const message =
                    checkedRows.length === 1 ? "cette déclaration" : `ces ${checkedRows.length} déclarations`;
                  if (confirm(`Êtes-vous sûr de vouloir supprimer ${message} ? Cette action est irréversible.`)) {
                    await deleteAdminDeclarations(data.filter(declaration => checkedRows.includes(getId(declaration))));
                    router.refresh();
                  }
                },
              },
            },
          ]}
        />
        <ButtonsGroup
          inlineLayoutWhen="always"
          buttonsSize="small"
          alignment="right"
          buttons={[
            {
              children: "Limit",
              disabled: true,
              priority: "tertiary no outline",
              className: "!cursor-default",
              iconId: "fr-icon-arrow-right-line",
              iconPosition: "right",
            },
            ...limits.map<ButtonProps>(limit => ({
              children: limit,
              priority: limit === currentLimit ? "tertiary" : "tertiary no outline",
              type: "button",
              nativeButtonProps: {
                onClick() {
                  if (limit === currentLimit) return;
                  const url = new URL(location.href);
                  url.searchParams.set("limit", limit.toString());
                  router.replace(url.toString(), { scroll: false });
                },
              },
            })),
          ]}
        />
      </Box>
      <TableAdmin
        compact
        classes={{
          table: style.table,
          wrapper: style.tableWrapper,
        }}
      >
        <TableAdminHead>
          <TableAdminHeadCol>
            <div className="flex justify-center">
              <input
                type="checkbox"
                name="selectAll"
                checked={checkedAll === CheckAllState.Checked}
                onChange={e => doCheckAll(e.target.checked)}
                ref={checkAllRef}
              />
            </div>
          </TableAdminHeadCol>
          {Object.entries(columnMap).map(([columnValue, columnLabel]) => (
            <TableAdminHeadCol
              key={columnValue}
              orderDirection={orderBy === columnValue && orderDirection}
              onClick={() => onClickHeadCol(columnValue, orderDirection, orderBy)}
            >
              {columnLabel}
            </TableAdminHeadCol>
          ))}
        </TableAdminHead>
        <TableAdminBody ref={tableBodyParent}>
          {data.map(declaration => {
            const id = getId(declaration);
            return (
              <TableAdminBodyRow key={id}>
                <TableAdminBodyRowCol>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      name={id}
                      checked={checkedRows.includes(id)}
                      onChange={e => doCheckRow(id, e.target.checked)}
                    />
                  </div>
                </TableAdminBodyRowCol>
                <TableAdminBodyRowCol>
                  <Badge small severity={declaration.type === "index" ? "new" : "info"} noIcon>
                    {declaration.type}
                  </Badge>
                </TableAdminBodyRowCol>
                <TableAdminBodyRowCol>
                  <Link
                    href={`/${
                      declaration.type === "index" ? "index-egapro/declaration" : "representation-equilibree"
                    }/${declaration.siren}/${declaration.year}`}
                    target="_blank"
                  >
                    {declaration.siren}
                  </Link>
                </TableAdminBodyRowCol>
                <TableAdminBodyRowCol>{declaration.year}</TableAdminBodyRowCol>
                <TableAdminBodyRowCol className={style.tableColumnName} title={declaration.name}>
                  {declaration.name}
                </TableAdminBodyRowCol>
                <TableAdminBodyRowCol>{formatDateToFr(declaration.createdAt)}</TableAdminBodyRowCol>
                <TableAdminBodyRowCol title={declaration.declarantEmail}>
                  {declaration.declarantEmail}
                </TableAdminBodyRowCol>
                <TableAdminBodyRowCol>{declaration.declarantFirstName}</TableAdminBodyRowCol>
                <TableAdminBodyRowCol>{declaration.declarantLastName}</TableAdminBodyRowCol>
                <TableAdminBodyRowCol>
                  {declaration.type === "index" ? declaration.index ?? "N.C" : "N/A"}
                </TableAdminBodyRowCol>
                <TableAdminBodyRowCol
                  title={
                    declaration.type === "index" && declaration.ues
                      ? declaration.ues.companies?.map(company => `${company.siren} - ${company.name}`).join("\n")
                      : void 0
                  }
                >
                  {declaration.type === "index" ? (
                    declaration.ues ? (
                      <span className="underline cursor-help">
                        {declaration.ues.name} ({declaration.ues.companies?.length ?? 0})
                      </span>
                    ) : (
                      "-"
                    )
                  ) : (
                    "N/A"
                  )}
                </TableAdminBodyRowCol>
              </TableAdminBodyRow>
            );
          })}
        </TableAdminBody>
      </TableAdmin>
    </>
  );
};
