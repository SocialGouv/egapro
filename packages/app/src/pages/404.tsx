import { BasicLayoutPublic } from "@components/layouts/BasicLayoutPublic";
import { push } from "@socialgouv/matomo-next";
import { useEffect } from "react";

import { Box } from "../design-system/base/Box";
import { Text } from "../design-system/base/Typography";
import { type NextPageWithLayout } from "./_app";

const NotFoundPage: NextPageWithLayout = () => {
  useEffect(() => {
    push(["trackEvent", "404", "Page non trouvée"]);
  }, []);

  return (
    <Box style={{ textAlign: "center" }} mt="8v">
      <Text variant="xl" text="Malheureusement la page que vous cherchez n'existe pas !" />
    </Box>
  );
};

NotFoundPage.getLayout = ({ children }) => {
  return <BasicLayoutPublic title="Page non trouvée - Egapro">{children}</BasicLayoutPublic>;
};

export default NotFoundPage;
