"use client";

import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { storePicker } from "@common/utils/zustand";
import { add, isAfter } from "date-fns";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useRepeqFunnelStore } from "../../(funnel)/useRepeqFunnelStore";

export interface EditButtonProps {
  repEq: RepresentationEquilibreeDTO;
}
const useStore = storePicker(useRepeqFunnelStore);
export const EditButton = ({ repEq }: EditButtonProps) => {
  const router = useRouter();
  const session = useSession();
  const { company: _0, declaredAt: _1, modifiedAt: _2, ...rest } = repEq;

  const olderThanOneYear = session?.data?.user.staff
    ? false
    : repEq.declaredAt === undefined || isAfter(new Date(), add(new Date(repEq.declaredAt), { years: 1 }));
  const [resetFunnel, saveFunnel, setIsEdit] = useStore("resetFunnel", "saveFunnel", "setIsEdit");
  return (
    <ButtonsGroup
      className={fr.cx("fr-mt-2w")}
      inlineLayoutWhen="sm and up"
      buttons={[
        {
          children: "Précédent",
          priority: "secondary",
          onClick() {
            router.back();
          },
        },
        {
          children: "Modifier",
          disabled: olderThanOneYear,
          onClick() {
            resetFunnel();
            saveFunnel(rest);
            setIsEdit(true);
            router.replace("/representation-equilibree/declarant");
          },
        },
      ]}
    />
  );
};
