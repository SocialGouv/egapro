import { Box, Text } from "@chakra-ui/react";
import { push } from "@socialgouv/matomo-next";
import { useEffect } from "react";

import type { NextPageWithLayout } from "./_app";
import { BasicLayout } from "@components/layouts/BasicLayout";

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
  return <BasicLayout title="Page non trouvée - Egapro">{children}</BasicLayout>;
};

export default NotFoundPage;
