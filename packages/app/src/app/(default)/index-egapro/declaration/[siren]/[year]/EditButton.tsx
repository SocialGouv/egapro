"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { config } from "@common/config";
import { type DeclarationDTO } from "@common/models/generated";
import { BackNextButtonsGroup } from "@design-system";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { add, isAfter } from "date-fns";
import { useRouter } from "next/navigation";
import { type PropsWithChildren } from "react";

type Props = {
  déclaration: DeclarationDTO;
};

export const EditButton = ({ déclaration }: PropsWithChildren<Props>) => {
  const router = useRouter();
  const { setStatus } = useDeclarationFormManager();

  const date = déclaration.déclaration.date;

  const olderThanOneYear = date === undefined || isAfter(new Date(), add(new Date(date), { years: 1 }));

  return (
    <>
      <BackNextButtonsGroup
        className={fr.cx("fr-my-8w")}
        backProps={{
          onClick: () => router.push(`${config.base_declaration_url}/commencer`),
        }}
        nextLabel="Modifier"
        nextProps={{
          onClick: () => {
            setStatus("edition");
            router.push(`${config.base_declaration_url}/declarant`);
          },
          disabled: olderThanOneYear,
        }}
      />
    </>
  );
};
