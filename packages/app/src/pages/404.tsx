import { Box, Text } from "@chakra-ui/react";
import { push } from "@socialgouv/matomo-next";
import Head from "next/head";
import type { ReactElement } from "react";
import { useEffect } from "react";
import { ConsulterIndexLayout } from "@components/layouts/ConsulterIndexLayout";

export default function NotFoundPage() {
  useEffect(() => {
    push(["trackEvent", "404", "Page non trouvée"]);
  }, []);

  return (
    <>
      <Head>
        <title>Page non trouvée - Index Egapro</title>
      </Head>

      <Box textAlign="center" mt="8">
        <Text as="h2" fontSize="2xl">
          Malheureusement la page que vous cherchez n'existe pas !
        </Text>
      </Box>
    </>
  );
}

NotFoundPage.getLayout = function getLayout(page: ReactElement) {
  return <ConsulterIndexLayout>{page}</ConsulterIndexLayout>;
};
