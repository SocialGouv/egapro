"use client";

import { Stepper as BaseStepper, type StepperProps as BaseStepperProps } from "@codegouvfr/react-dsfr/Stepper";
import { type Any } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { useSelectedLayoutSegment } from "next/navigation";
import Skeleton from "react-loading-skeleton";

import { getFullNavigation, NAVIGATION } from "./navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "./useSimuFunnelStore";

export type StepperProps = BaseStepperProps;

type NavigationPath = keyof typeof NAVIGATION;

const useStore = storePicker(useSimuFunnelStore);
export const Stepper = () => {
  const [funnel, selectedWorkforceRange] = useStore("funnel", "selectedWorkforceRange");
  const hydrated = useSimuFunnelStoreHasHydrated();
  const segment = useSelectedLayoutSegment();
  const currentNavigation = NAVIGATION[segment as NavigationPath] || {};

  if (!hydrated) {
    return (
      <BaseStepper stepCount={8} currentStep={0} title={currentNavigation.title} nextTitle={<Skeleton width={200} />} />
    );
  }

  const steps = getFullNavigation(
    {
      effectifs: {
        workforceRange: selectedWorkforceRange,
      },
    } as Any,
    "commencer",
  );
  const currentStep = steps.findIndex(step => step === segment) + 1; // 1-based
  const nextNavigation = (
    "next" in currentNavigation ? NAVIGATION[currentNavigation.next(funnel)] : {}
  ) as (typeof NAVIGATION)[NavigationPath];

  return (
    <BaseStepper
      stepCount={steps.length}
      currentStep={currentStep}
      title={currentNavigation.title}
      nextTitle={nextNavigation.title}
    />
  );
};
