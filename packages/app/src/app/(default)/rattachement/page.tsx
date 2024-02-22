import { AddDeclarer } from "./AddDeclarer";

const title = "Connexion";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const RattachementPage = () => {
  return (
    <>
      <AddDeclarer />
    </>
  );
};

export default RattachementPage;
