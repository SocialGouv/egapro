import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";

import { AlertEdition } from "../AlertEdition";
import { TITLES } from "../titles";
import { PeriodeReferenceForm } from "./Form";

const title = TITLES["periode-reference"];

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
