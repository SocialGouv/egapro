import "@design-system/theme";

import { useEffect } from "react";

export interface DsfrScriptProps {
  enableJs?: boolean;
}
export const DsfrScript = ({ enableJs }: DsfrScriptProps) => {
  useEffect(() => {
    enableJs && import("@gouvfr/dsfr/dist/dsfr.module");
  }, [enableJs]);
  return <></>;
};
