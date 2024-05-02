"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { config } from "@common/config";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { BackNextButtonsGroup } from "@design-system";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { add, isAfter } from "date-fns";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type PropsWithChildren } from "react";

import { prepareDataWithExistingDeclaration } from "../../commencer/CommencerForm";
import { funnelConfig } from "../../declarationFunnelConfiguration";

type Props = {
  déclaration: DeclarationDTO;
  year: number;
};

export const EditButton = ({ déclaration, year }: PropsWithChildren<Props>) => {
  const session = useSession();
  const router = useRouter();
  const { setStatus, saveFormData, resetFormData } = useDeclarationFormManager();

  const date = déclaration["declaration-existante"].date;

  const olderThanOneYear = session?.data?.staff
    ? false
    : date === undefined || isAfter(new Date(), add(new Date(date), { years: 1 }));
  const saveAndGoNext = async (
    { siren, annéeIndicateurs }: { annéeIndicateurs: number; siren: string },
    formData: DeclarationDTO,
  ) => {
    try {
      // Synchronize the data with declaration if any.
      const newData = await prepareDataWithExistingDeclaration(siren, annéeIndicateurs, formData);

      // Save in storage (savePageData is not used because we want to save commencer page and declaration-existante).
      saveFormData(newData);

      router.push(funnelConfig(newData)["commencer"].next().url);
    } catch (error: unknown) {
      console.error("Unexpected API error", error);
    }
  };

  return (
    <>
      <BackNextButtonsGroup
        className={fr.cx("fr-my-8w")}
        backProps={{
          onClick: () => router.push(`${config.base_declaration_url}/commencer`),
        }}
        nextLabel="Modifier"
        nextProps={{
          onClick: async () => {
            setStatus("edition");
            resetFormData();
            await saveAndGoNext(
              {
                siren: déclaration.entreprise?.entrepriseDéclarante?.siren ?? "",
                annéeIndicateurs: year,
              },
              déclaration,
            );
            //  router.push(`${config.base_declaration_url}/declarant`);
          },
          disabled: olderThanOneYear,
        }}
      />
    </>
  );
};
