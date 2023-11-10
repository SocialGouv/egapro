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
      <EntrepriseForm />
    </>
  );
};

export default InformationsEntreprise;
