"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/Select";
import { NotComputableReasonMemberRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonMemberRepEq";
import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { type UnionToIntersection } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { PercentagesPairInputs } from "@components/rdsfr/PercentagesPairInputs";
import { Box, FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { useRepeqFunnelStore } from "../useRepeqFunnelStore";

type EcartsMembresFormType = UnionToIntersection<z.infer<typeof createSteps.ecartsMembres>>;

const useStore = storePicker(useRepeqFunnelStore);
export const EcartsMembresForm = () => {
  const router = useRouter();
  const [isComputable, setComputable] = useState<boolean>();
  const [funnel, saveFunnel, resetFunnel] = useStore("funnel", "saveFunnel", "resetFunnel");

  const methods = useForm<EcartsMembresFormType>({
    mode: "onChange",
    resolver: zodResolver(createSteps.ecartsMembres),
    defaultValues: funnel,
  });

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    reset,
  } = methods;

  useEffect(() => {
    console.log({ funnel });
    if (!funnel) return;
    if ("notComputableReasonMembers" in funnel) {
      setComputable(false);
    } else if ("memberWomenPercent" in funnel) {
      setComputable(true);
    }
  }, []);

  const onSubmit = (data: EcartsMembresFormType) => {
    if (!funnel) return;

    if (!data.notComputableReasonMembers) {
      const { notComputableReasonMembers: _, ...rest } = funnel as EcartsMembresFormType;
      resetFunnel();
      saveFunnel({ ...rest, ...data });
    } else {
      const { memberMenPercent: _1, memberWomenPercent: _2, ...rest } = funnel as EcartsMembresFormType;
      resetFunnel();
      saveFunnel({ ...rest, ...data });

      // Skip directly to validation page if all indicators are not computable.
      if ("notComputableReasonExecutives" in funnel) return router.push("/representation-equilibree/validation");
    }

    router.push("/representation-equilibree/publication");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormLayout>
        <RadioButtons
          legend="L’écart de représentation est-il calculable ?"
          orientation="horizontal"
          options={[
            {
              label: "Oui",
              nativeInputProps: {
                defaultChecked: isComputable,
                onChange() {
                  setComputable(true);
                  reset();
                },
              },
            },
            {
              label: "Non",
              nativeInputProps: {
                defaultChecked: isComputable === false,
                onChange() {
                  setComputable(false);
                  reset();
                },
              },
            },
          ]}
        />
        <Box style={{ display: isComputable ? "block" : "none" }}>
          <FormProvider {...methods}>
            <PercentagesPairInputs<EcartsMembresFormType>
              first={{
                formKey: "memberWomenPercent",
                label: "Pourcentage de femmes parmi les membres des instances dirigeantes",
              }}
              second={{
                formKey: "memberMenPercent",
                label: "Pourcentage d'hommes parmi les membres des instances dirigeantes",
              }}
              options={{
                disabled: isComputable === false,
              }}
            />
          </FormProvider>
        </Box>
        <Select
          label="Motif de non calculabilité"
          state={errors.notComputableReasonMembers && "error"}
          stateRelatedMessage={errors.notComputableReasonMembers?.message}
          style={{ display: isComputable === false ? "block" : "none" }}
          nativeSelectProps={{
            ...register("notComputableReasonMembers", {
              disabled: isComputable,
            }),
          }}
        >
          <option value="" disabled>
            Sélectionnez un motif
          </option>
          {Object.entries(NotComputableReasonMemberRepEq.Label).map(([key, label]) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </Select>
        <ButtonsGroup
          inlineLayoutWhen="sm and up"
          buttons={[
            {
              children: "Précédent",
              linkProps: {
                href: "/representation-equilibree/ecarts-cadres",
              },
              priority: "secondary",
            },
            {
              children: "Suivant",
              type: "submit",
              disabled: !isValid,
            },
          ]}
        />
      </FormLayout>
    </form>
  );
};
