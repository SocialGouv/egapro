import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";

import { AlertEdition } from "../AlertEdition";
import { PeriodeReferenceForm } from "./Form";

const title = "Période de référence";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const PeriodeReference = () => {
  return (
    <>
      <ClientAnimate>
        <AlertEdition />
      </ClientAnimate>

      <PeriodeReferenceForm />
    </>
  );
};

export default PeriodeReference;
