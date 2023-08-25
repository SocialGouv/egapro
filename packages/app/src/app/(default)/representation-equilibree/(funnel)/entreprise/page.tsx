import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";

import { AlertEdition } from "../AlertEdition";
import { TITLES } from "../titles";
import { EntrepriseForm } from "./Form";

const title = TITLES.entreprise;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const InformationsEntreprise = () => {
  return (
    <>
      <ClientAnimate>
        <AlertEdition />
      </ClientAnimate>

      <EntrepriseForm />
    </>
  );
};

export default InformationsEntreprise;
