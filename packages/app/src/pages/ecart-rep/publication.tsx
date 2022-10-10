import type { NextPageWithLayout } from "../_app";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";

const title = "Publication";

const PublicationPage: NextPageWithLayout = () => {
  return (
    <>
      <h1>{title}</h1>
      <p></p>
    </>
  );
};

PublicationPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default PublicationPage;
