import {
  Box,
  Center,
  Flex,
  Heading,
  Input,
  LinkBox,
  LinkOverlay,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { format } from "date-fns";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { HiDownload } from "react-icons/hi";

import type { NextPageWithLayout } from "../_app";
import { AverageIndicator } from "@components/AverageIndicator";
import { ButtonAction } from "@components/ds/ButtonAction";
import { ConsulterIndexLayout } from "@components/layouts/ConsulterIndexLayout";

async function getDateCsv(): Promise<string> {
  try {
    const responseCsv = await fetch("/index-egalite-fh.csv", { method: "HEAD" });
    const date = responseCsv?.headers?.get("last-modified");

    if (date) {
      const lastModified = new Date(date);
      return format(lastModified, "dd/MM/yyyy");
    }
  } catch (error) {
    console.error("Error on fetch HEAD /index-egalite-fh.csv", error);
  }
  return "";
}

function FormSearchSiren() {
  const router = useRouter();
  const formRef = React.useRef(null);
  const bgSelect = useColorModeValue("white", "blue.700");

  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    const data = new FormData(formRef.current || undefined);

    const { q } = Object.fromEntries(data);

    router.push("consulter-index/recherche" + (q ? `?q=${q}` : ""));
  }

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: "center" }} ref={formRef} noValidate>
      <Heading as="h1" fontFamily="gabriela" size="lg" mb={["8", "12"]} mt={["0", "4"]}>
        Consulter l'index de l'égalité professionnelle d'une entreprise
      </Heading>
      <Box>
        <Flex align="center" justifyContent="center" mx={["0", "16"]}>
          <Input
            placeholder="Saisissez le nom ou le SIREN d'une entreprise"
            size="lg"
            name="q"
            type="text"
            bgColor={bgSelect}
            mr="4"
          />
          <ButtonAction label="Rechercher" type="submit" />
        </Flex>
      </Box>
    </form>
  );
}

function DownloadCsvFileZone() {
  const [dateCsv, setDateCsv] = React.useState("");

  React.useEffect(() => {
    async function runEffect() {
      setDateCsv(await getDateCsv());
    }
    runEffect();
  }, []);

  return (
    <>
      {dateCsv && (
        <Center w="100vw" paddingTop="0" paddingBottom="12">
          <Flex justify="center" align="center" mx={["4", "0"]} direction={["column", "row"]}>
            <Text fontSize={["md", "lg"]} mr={["0", "6"]} mb={["4", "0"]} textAlign="center">
              Télécharger le fichier des entreprises au {dateCsv}
            </Text>

            <LinkBox>
              <LinkOverlay href="/index-egalite-fh.csv">
                <ButtonAction variant="outline" leftIcon={<HiDownload />} label="Télécharger (CSV)" />
              </LinkOverlay>
            </LinkBox>
          </Flex>
        </Center>
      )}
    </>
  );
}

const HomePage: NextPageWithLayout = () => {
  return (
    <VStack spacing={["3", "6"]}>
      <Head>
        <title>Index Egapro</title>
      </Head>

      <FormSearchSiren />
      <Box h="8" />

      <DownloadCsvFileZone />

      <AverageIndicator />
    </VStack>
  );
};

HomePage.getLayout = ({ children }) => <ConsulterIndexLayout>{children}</ConsulterIndexLayout>;

export default HomePage;
