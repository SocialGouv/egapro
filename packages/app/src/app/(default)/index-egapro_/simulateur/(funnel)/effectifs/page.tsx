import { EffectifsForm } from "./Form";

const title = "Tranches et effectifs pris en compte";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const EffectifsPage = () => {
  return (
    <>
      <EffectifsForm />
    </>
  );
};

export default EffectifsPage;
