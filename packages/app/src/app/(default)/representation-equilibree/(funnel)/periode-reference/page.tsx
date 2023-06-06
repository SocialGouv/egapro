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
      {/* <AlertEdition /> */}
      <PeriodeReferenceForm />
    </>
  );
};

export default PeriodeReference;
