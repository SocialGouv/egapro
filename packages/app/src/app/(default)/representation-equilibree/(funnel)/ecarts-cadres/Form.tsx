"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/Select";
import { NotComputableReasonExecutiveRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonExecutiveRepEq";
import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { type UnionToIntersection } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { PercentagesPairInputs } from "@components/rdsfr/PercentagesPairInputs";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { Box, FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

type EcartsCadresFormType = UnionToIntersection<z.infer<typeof createSteps.ecartsCadres>>;

const useStore = storePicker(useRepeqFunnelStore);
export const EcartsCadresForm = () => {
  const router = useRouter();
  const [isComputable, setComputable] = useState<boolean>();
  const [funnel, saveFunnel, resetFunnel] = useStore("funnel", "saveFunnel", "resetFunnel");
  const hydrated = useRepeqFunnelStoreHasHydrated();

  const methods = useForm<EcartsCadresFormType>({
    mode: "onChange",
    resolver: zodResolver(createSteps.ecartsCadres),
    defaultValues: funnel,
  });

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    reset,
    trigger,
  } = methods;

  useEffect(() => {
    if (!funnel) return; // dummy typesafe ; funnel is already available
    if ("notComputableReasonExecutives" in funnel) {
      setComputable(false);
    } else if ("executiveWomenPercent" in funnel) {
      setComputable(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- need to be triggered on mount only
  }, []);

  if (!hydrated) {
    return <SkeletonForm fields={1} />;
  }

  if (funnel && !funnel.year) {
    redirect("/representation-equilibree/commencer");
  }

  const onSubmit = (data: EcartsCadresFormType) => {
    if (!funnel) return;

    if (!data.notComputableReasonExecutives) {
      const { notComputableReasonExecutives: _, ...rest } = funnel as EcartsCadresFormType;
      resetFunnel();
      saveFunnel({ ...rest, ...data });
    } else {
      const { executiveMenPercent: _1, executiveWomenPercent: _2, ...rest } = funnel as EcartsCadresFormType;
      resetFunnel();
      saveFunnel({ ...rest, ...data });
    }

    router.push("/representation-equilibree/ecarts-membres");
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
                  trigger("executiveWomenPercent", { shouldFocus: true });
                  trigger("executiveMenPercent");
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
            <PercentagesPairInputs<EcartsCadresFormType>
              first={{ formKey: "executiveWomenPercent", label: "Pourcentage de femmes parmi les cadres dirigeants" }}
              second={{ formKey: "executiveMenPercent", label: "Pourcentage d'hommes parmi les cadres dirigeants" }}
              options={{
                disabled: isComputable === false,
              }}
            />
          </FormProvider>
        </Box>
        <Select
          label="Motif de non calculabilité"
          state={errors.notComputableReasonExecutives && "error"}
          stateRelatedMessage={errors.notComputableReasonExecutives?.message}
          style={{ display: isComputable === false ? "block" : "none" }}
          nativeSelectProps={{
            ...register("notComputableReasonExecutives", {
              disabled: isComputable,
            }),
          }}
        >
          <option value="" disabled>
            Sélectionnez un motif
          </option>
          {Object.entries(NotComputableReasonExecutiveRepEq.Label).map(([key, label]) => (
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
                href: "/representation-equilibree/periode-reference",
              },
              priority: "secondary",
            },
            {
              children: "Suivant",
              type: "submit",
              disabled: !isValid || typeof isComputable === "undefined",
            },
          ]}
        />
      </FormLayout>
    </form>
  );
};
