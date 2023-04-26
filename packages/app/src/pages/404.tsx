import { Box, Text } from "@chakra-ui/react";
import { BasicLayoutPublic } from "@components/layouts/BasicLayoutPublic";
import { push } from "@socialgouv/matomo-next";
import { useEffect } from "react";

import { type NextPageWithLayout } from "./_app";

const NotFoundPage: NextPageWithLayout = () => {
  useEffect(() => {
    push(["trackEvent", "404", "Page non trouvée"]);
  }, []);

  return (
    <Box textAlign="center" mt="8">
      <Text as="h2" fontSize="2xl">
        Malheureusement la page que vous cherchez n'existe pas !
      </Text>
    </Box>
  );
};

NotFoundPage.getLayout = ({ children }) => {
  return <BasicLayoutPublic title="Page non trouvée - Egapro">{children}</BasicLayoutPublic>;
};

export default NotFoundPage;
