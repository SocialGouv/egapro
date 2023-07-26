"use client";

import { ClientOnly } from "@components/utils/ClientOnly";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { useRouter } from "next/navigation";

import { BackNextButtons } from "../BackNextButtons";
import { type FunnelKey } from "../declarationFunnelConfiguration";

const stepName: FunnelKey = "validation-transmission";

export const RecapFunnel = () => {
  const router = useRouter();
  const [animationParent] = useAutoAnimate();
  const { formData, saveFormData } = useDeclarationFormManager();

  const onSubmit = async () => {
    console.log("dans onSubmit");

    // router.push(funnelConfig(formData)[stepName].next().url);
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div ref={animationParent}>
        <ClientOnly fallback={<SkeletonForm fields={2} />}>
          {/* <RecapDeclaration déclaration={declaration?.data} /> */}

          <BackNextButtons stepName={stepName} />
        </ClientOnly>
      </div>
    </form>
  );
};
