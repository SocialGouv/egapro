"use client";

import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/Select";
import { NotComputableReasonMemberRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonMemberRepEq";
import { createSteps } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { type UnionToIntersection } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { NumberPairInputs } from "@components/RHF/NumbersPairInputs";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, Box, FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { useRepeqFunnelStore, useRepeqFunnelStoreHasHydrated } from "../useRepeqFunnelStore";

type EcartsMembresFormType = UnionToIntersection<z.infer<typeof createSteps.ecartsMembres>>;

const useStore = storePicker(useRepeqFunnelStore);
export const EcartsMembresForm = () => {
  const router = useRouter();
  const [isComputable, setComputable] = useState<boolean>();
  const [funnel, saveFunnel, resetFunnel] = useStore("funnel", "saveFunnel", "resetFunnel");
  const hydrated = useRepeqFunnelStoreHasHydrated();

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
    setFocus,
  } = methods;

  useEffect(() => {
    if (!funnel) return; // dummy typesafe ; funnel is already available
    if ("notComputableReasonMembers" in funnel) {
      setComputable(false);
    } else if ("memberWomenPercent" in funnel) {
      setComputable(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- need to be triggered on mount
  }, []);

  if (!hydrated) {
    return <SkeletonForm fields={1} />;
  }

  if (hydrated && !funnel?.year) redirect("/representation-equilibree/commencer");

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
      <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
      <FormLayout>
        <RadioButtons
          legend="L’écart de représentation est-il calculable ? *"
          orientation="horizontal"
          options={[
            {
              label: "Oui",
              nativeInputProps: {
                defaultChecked: isComputable,
                onChange() {
                  setComputable(true);
                  reset();
                  setTimeout(() => setFocus("memberWomenPercent", { shouldSelect: true }), 0);
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
        {isComputable && (
          <Box>
            <FormProvider {...methods}>
              <NumberPairInputs<EcartsMembresFormType>
                first={{
                  formKey: "memberWomenPercent",
                  label: "Pourcentage de femmes parmi les membres des instances dirigeantes *",
                }}
                second={{
                  formKey: "memberMenPercent",
                  label: "Pourcentage d'hommes parmi les membres des instances dirigeantes *",
                }}
                options={{
                  disabled: isComputable === false,
                  max: 100,
                  min: 0,
                  step: 0.1,
                  iconId: "ri-percent-line",
                }}
              />
            </FormProvider>
          </Box>
        )}
        {isComputable === false && (
          <Select
            label="Motif de non calculabilité *"
            state={errors.notComputableReasonMembers && "error"}
            stateRelatedMessage={errors.notComputableReasonMembers?.message}
            nativeSelectProps={{
              ...register("notComputableReasonMembers", {
                disabled: isComputable,
              }),
            }}
          >
            <option value="" hidden>
              Sélectionnez un motif
            </option>
            {Object.entries(NotComputableReasonMemberRepEq.Label).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </Select>
        )}
        <BackNextButtonsGroup
          backProps={{
            linkProps: {
              href: "/representation-equilibree/ecarts-cadres",
            },
          }}
          nextDisabled={!isValid || typeof isComputable === "undefined"}
        />
      </FormLayout>
    </form>
  );
};
