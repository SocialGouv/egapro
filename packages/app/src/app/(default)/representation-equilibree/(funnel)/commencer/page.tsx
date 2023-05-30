import { CommencerForm } from "./Form";

const title = "Commencer";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const CommencerPage = () => {
  return (
    <>
      <p>
        <b>
          Si vous souhaitez visualiser ou modifier une déclaration déjà transmise, veuillez saisir les informations
          correspondantes à la déclaration.
        </b>
      </p>
      <CommencerForm />
    </>
  );
};

export default CommencerPage;
