import { TITLES } from "../titles";
import { EffectifsForm } from "./Form";

const title = TITLES.effectifs;

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
