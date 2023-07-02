"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import { type ReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import { COUNTIES, REGIONS } from "@common/dict";
import { storePicker } from "@common/utils/zustand";
import {
  Icon,
  Link,
  TableAdmin,
  TableAdminBody,
  TableAdminBodyRow,
  TableAdminBodyRowCol,
  TableAdminHead,
  TableAdminHeadCol,
} from "@design-system";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { noop, orderBy as _orderBy, truncate } from "lodash";
import { experimental_useOptimistic as useOptimistic } from "react";
import { useForm } from "react-hook-form";

import { deleteReferent } from "./actions";
import { editReferentModalButtonProps } from "./EditReferentModal";
import { columnMap, useReferentListStore, useReferentListStoreHasHydrated } from "./useReferentListStore";

interface ReferentListProps {
  referents: ReferentDTO[];
}

const useStore = storePicker(useReferentListStore);
export const ReferentList = ({ referents: data }: ReferentListProps) => {
  const [orderBy, orderDirection, setCurrentEdited, togglerOrderColumn] = useStore(
    "orderBy",
    "orderDirection",
    "setCurrentEdited",
    "togglerOrderColumn",
  );
  const hydrated = useReferentListStoreHasHydrated();
  const [optimisticReferents, optimisticDeleteReferent] = useOptimistic<ReferentDTO[], ReferentDTO>(
    data,
    (state, deletedReferent) => [...state.filter(referent => referent.id !== deletedReferent.id)],
  );
  const [animationParent] = useAutoAnimate<HTMLTableSectionElement>();

  const doEditLine = (referent: ReferentDTO) => {
    setCurrentEdited(referent);
  };

  const { register, watch } = useForm<{ query: string }>();
  const searchString = watch("query");
  const referents = _orderBy(optimisticReferents, orderBy, orderDirection).filter(referent => {
    if (!searchString) return true;
    const str = searchString.toLowerCase();
    if (referent.county && COUNTIES[referent.county].toLowerCase().includes(str)) return true;
    if (REGIONS[referent.region].toLowerCase().includes(str)) return true;
    if (referent.name.toLowerCase().includes(str)) return true;
    if (referent.value.toLowerCase().includes(str)) return true;
    if (referent.type === "email") {
      if (referent.substitute?.email?.toLowerCase().includes(str)) return true;
      if (referent.substitute?.name?.toLowerCase().includes(str)) return true;
    }
  });

  return (
    <>
      <form noValidate onSubmit={noop}>
        <SearchBar
          label="Rechercher un référent"
          nativeInputProps={{
            placeholder: "Rechercher",
            autoComplete: "off",
            ...register("query"),
          }}
          className="fr-mb-2w"
        />
      </form>
      <TableAdmin>
        <TableAdminHead>
          {columnMap.map(([columnValue, columnLabel]) => (
            <TableAdminHeadCol
              key={columnValue}
              orderDirection={orderBy === columnValue && orderDirection}
              onClick={() => {
                togglerOrderColumn(columnValue);
              }}
            >
              {columnLabel}
            </TableAdminHeadCol>
          ))}
          <TableAdminHeadCol>Actions</TableAdminHeadCol>
        </TableAdminHead>
        <TableAdminBody ref={animationParent}>
          {referents.map(referent => (
            <TableAdminBodyRow key={`referent-${referent.id}`}>
              <TableAdminBodyRowCol>
                {REGIONS[referent.region]} ({referent.region})
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                {referent.county ? `${COUNTIES[referent.county]} (${referent.county})` : "-"}
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                {referent.name}
                {referent.type === "email" && referent.substitute?.name ? (
                  <>
                    <br />
                    <i className="fr-text--xs">{referent.substitute.name}</i>
                  </>
                ) : (
                  ""
                )}
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <Link
                  size="sm"
                  iconLeft={referent.type === "email" ? "fr-icon-mail-fill" : "fr-icon-link"}
                  href={(referent.type === "email" ? "mailto:" : "") + referent.value}
                >
                  {truncate(referent.value, { length: 40 })}
                </Link>
                {referent.type === "email" && referent.substitute?.email ? (
                  <>
                    <br />
                    <Link size="sm" href={`mailto:${referent.substitute.email}`}>
                      <i className="fr-text--xs">{truncate(referent.substitute.email, { length: 40 })}</i>
                    </Link>
                  </>
                ) : (
                  ""
                )}
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <Icon
                  icon={referent.principal ? "fr-icon-checkbox-fill" : "fr-icon-close-circle-fill"}
                  color={referent.principal ? "text-default-success" : "text-default-error"}
                />
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <Button
                  size="small"
                  iconId="fr-icon-edit-fill"
                  priority="tertiary no outline"
                  title="Modifier"
                  onClick={() => doEditLine(referent)}
                  {...(hydrated ? editReferentModalButtonProps : {})}
                />{" "}
                <Button
                  size="small"
                  iconId="fr-icon-delete-fill"
                  priority="tertiary no outline"
                  title="Supprimer"
                  onClick={async () => {
                    if (!referent.id) {
                      console.warn("Cannot delete referent without id.", referent);
                      return;
                    }

                    const yes = confirm(`Supprimer "${referent.name}" ?`);
                    if (!yes) return;
                    optimisticDeleteReferent(referent);
                    await deleteReferent(referent);
                  }}
                />
              </TableAdminBodyRowCol>
            </TableAdminBodyRow>
          ))}
        </TableAdminBody>
      </TableAdmin>
    </>
  );
};
