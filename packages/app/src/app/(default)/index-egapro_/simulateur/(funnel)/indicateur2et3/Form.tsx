import { type createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { type ClearObject } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { type z } from "zod";

import { useSimuFunnelStore } from "../useSimuFunnelStore";

type Indic2and3FormType = ClearObject<z.infer<typeof createSteps.indicateur2and3>>;

const useStore = storePicker(useSimuFunnelStore);
export const Indic2and3Form = () => {
  return <>coucou</>;
};
