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
      <PeriodeReferenceForm />
    </>
  );
};

export default PeriodeReference;
