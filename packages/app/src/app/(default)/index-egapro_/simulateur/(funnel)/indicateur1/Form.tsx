"use client";

import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { ageRanges, type ExternalRemunerations, flattenRemunerations } from "@common/core-domain/computers/utils";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { Object } from "@common/utils/overload";
import { type Any } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, CenteredContainer, Container } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { CSPModeTable } from "./CSPModeTable";
import { OtherModesTable } from "./OtherModesTable";
import { getIsEnoughEmployees } from "./tableUtil";

const schemaOtherComputer = new IndicateurUnComputer(RemunerationsMode.Enum.OTHER_LEVEL);
const formSchema = createSteps.indicateur1
  .and(createSteps.effectifs)
  .superRefine(({ mode, remunerations, csp }, ctx) => {
    if (mode !== RemunerationsMode.Enum.CSP) {
      // test if there is the same amount of CSP in effectifs and remunerations
      schemaOtherComputer.setInput(flattenRemunerations(remunerations as ExternalRemunerations));

      const { enoughWomen, enoughMen } = getIsEnoughEmployees({
        computer: schemaOtherComputer,
        effectifsCsp: csp,
      });

      if (!enoughWomen || !enoughMen) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Le nombre de femmes et d'hommes dans les données saisies ne correspond pas au nombre de femmes et d'hommes dans les données de la page précédente`,
          path: ["remunerations"],
        });
      }
    }
  });
type Indic1FormType = z.infer<typeof formSchema>;
const indicateur1Navigation = NAVIGATION.indicateur1;

const cspComputer = new IndicateurUnComputer(RemunerationsMode.Enum.CSP);
const otherComputer = new IndicateurUnComputer(RemunerationsMode.Enum.OTHER_LEVEL);

const useStore = storePicker(useSimuFunnelStore);
export const Indic1Form = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const hydrated = useSimuFunnelStoreHasHydrated();
  const [lastCspRemunerations, setLastCspRemunerations] = useState<ExternalRemunerations>();
  const [lastOtherRemunerations, setLastOtherRemunerations] = useState<ExternalRemunerations>();
  const [lastMode, setLastMode] = useState<RemunerationsMode.Enum>();
  const [defaultRemunerationsOtherModes, setDefaultRemunerationsOtherModes] = useState<ExternalRemunerations>();

  useEffect(() => {
    if (funnel?.indicateur1?.mode) {
      setLastMode(funnel.indicateur1.mode);
    }
  }, []);

  const methods = useForm<Indic1FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...funnel?.indicateur1,
      ...funnel?.effectifs,
    },
    criteriaMode: "all",
  });

  const {
    formState: { isValid },
    handleSubmit,
    getValues,
    watch,
    resetField,
    control,
  } = methods;

  if (!hydrated) {
    return (
      <CenteredContainer pb="6w">
        <SkeletonForm fields={1} />
      </CenteredContainer>
    );
  }

  if (!funnel?.effectifs) {
    redirect(simulateurPath("effectifs"));
  }

  const currentMode = watch("mode");

  // default values for CSP mode, set category to empty if no data only if count is >= 3
  const defaultCspModeRemunerations = Object.keys(funnel.effectifs.csp).map<ExternalRemunerations[number]>(
    categoryName => ({
      name: categoryName,
      categoryId: categoryName,
      category: ageRanges.reduce(
        (newAgeGroups, ageRange) => ({
          ...newAgeGroups,
          ...(funnel.effectifs!.csp[categoryName].ageRanges[ageRange].women >= 3 &&
          funnel.effectifs!.csp[categoryName].ageRanges[ageRange].men >= 3
            ? {
                [ageRange]: {
                  womenCount: funnel.effectifs!.csp[categoryName].ageRanges[ageRange].women,
                  menCount: funnel.effectifs!.csp[categoryName].ageRanges[ageRange].men,
                },
              }
            : {}),
        }),
        {} as ExternalRemunerations[number]["category"],
      ),
    }),
  );

  const defaultOtherModesRemunerations = [
    {
      name: "",
      category: ageRanges.reduce(
        (newAgeGroups, ageRange) => ({
          ...newAgeGroups,
          [ageRange]: {},
        }),
        {},
      ),
    } as ExternalRemunerations[number],
  ];

  const onSubmit = ({ mode, remunerations }: Indic1FormType) => {
    saveFunnel({ indicateur1: { mode, remunerations } as Any });
    router.push(simulateurPath(indicateur1Navigation.next(funnel)));
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <CenteredContainer>
          <Controller
            control={control}
            name="mode"
            render={({ field }) => {
              return (
                <RadioButtons
                  legend="Modalité de calcul choisie pour cet indicateur"
                  options={[
                    ...[
                      RemunerationsMode.Enum.CSP,
                      RemunerationsMode.Enum.BRANCH_LEVEL,
                      RemunerationsMode.Enum.OTHER_LEVEL,
                    ].map(mode => ({
                      label: RemunerationsMode.Label[mode],
                      nativeInputProps: {
                        ...field,
                        value: mode,
                        defaultChecked: field.value === mode,
                        onChange() {
                          if (
                            mode !== RemunerationsMode.Enum.CSP &&
                            lastMode &&
                            lastMode !== RemunerationsMode.Enum.CSP
                          ) {
                            setLastMode(mode);
                            return field.onChange(mode);
                          }
                          const defaultValue =
                            mode === RemunerationsMode.Enum.CSP
                              ? lastCspRemunerations ?? defaultCspModeRemunerations
                              : lastOtherRemunerations ?? defaultOtherModesRemunerations;
                          const currentRemunerations = getValues("remunerations");
                          if (lastMode && currentRemunerations?.length) {
                            if (lastMode === RemunerationsMode.Enum.CSP) {
                              setLastCspRemunerations(currentRemunerations as ExternalRemunerations);
                            } else {
                              setLastOtherRemunerations(currentRemunerations as ExternalRemunerations);
                            }
                          }
                          setLastMode(mode);
                          field.onChange(mode);
                          if (mode === RemunerationsMode.Enum.CSP || currentRemunerations?.length) {
                            resetField("remunerations", { defaultValue });
                          } else {
                            // we cannot reset before useFieldArray has been initialized
                            setDefaultRemunerationsOtherModes(defaultValue);
                          }
                        },
                      },
                    })),
                  ]}
                />
              );
            }}
          />
        </CenteredContainer>
        <Container mb="4w">
          {currentMode && (
            <ClientAnimate>
              {currentMode === RemunerationsMode.Enum.CSP ? (
                <CSPModeTable computer={cspComputer} staff={session?.user.staff} />
              ) : (
                <ClientAnimate>
                  <OtherModesTable
                    computer={otherComputer}
                    staff={session?.user.staff}
                    defaultRemunerations={defaultRemunerationsOtherModes}
                  />
                </ClientAnimate>
              )}
            </ClientAnimate>
          )}
        </Container>
        <CenteredContainer pb="6w">
          <BackNextButtonsGroup
            backProps={{
              linkProps: {
                href: simulateurPath(indicateur1Navigation.prev()),
              },
            }}
            nextDisabled={!isValid}
          />
        </CenteredContainer>
      </form>
    </FormProvider>
  );
};
