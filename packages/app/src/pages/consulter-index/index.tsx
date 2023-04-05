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
import { AverageIndicator } from "@components/AverageIndicator";
import { ButtonAction } from "@components/ds/ButtonAction";
import { TextLink } from "@components/ds/TextLink";
import { ConsulterIndexLayout } from "@components/layouts/ConsulterIndexLayout";
import { getLastModifiedDateFile } from "@services/apiClient/getDateFile";
import { useRouter } from "next/router";
import type { DOMAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import { HiDownload } from "react-icons/hi";

import type { NextPageWithLayout } from "../_app";

function FormSearchSiren() {
  const router = useRouter();
  const formRef = useRef(null);
  const bgSelect = useColorModeValue("white", "blue.700");

  const handleSubmit: DOMAttributes<HTMLFormElement>["onSubmit"] = event => {
    event.preventDefault();
    const data = new FormData(formRef.current || undefined);

    const { q } = Object.fromEntries(data);

    router.push("consulter-index/recherche" + (q ? `?q=${q}` : ""));
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: "center" }} ref={formRef} noValidate>
      <Heading
        as="h1"
        fontFamily="gabriela"
        size="lg"
        mb={["8", "12"]}
        mt={["0", "4"]}
        color="var(--chakra-colors-chakra-body-text)"
      >
        Rechercher l'index de l'égalité professionnelle d'une entreprise
      </Heading>
      <Box>
        <Flex align="center" justifyContent="center" mx={["0", "16"]}>
          <Input
            placeholder="Saisissez le nom ou le Siren d'une entreprise"
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

function DownloadFileZone() {
  const [date, setDate] = useState("");

  useEffect(() => {
    async function runEffect() {
      setDate(await getLastModifiedDateFile("/index-egalite-fh.xlsx"));
    }
    runEffect();
  }, []);

  return date ? (
    <Center w="100vw" paddingTop="0" paddingBottom="12">
      <Flex
        justify="center"
        align="center"
        mx={["4", "0"]}
        direction={["column", "row"]}
        sx={{
          a: {
            background: "none !important", // This is a hack to override the global css of dsfr on buttons.
          },
          "a:after": {
            display: "none !important",
          },
        }}
      >
        <Text fontSize={["md", "lg"]} mr={["0", "6"]} mb={["4", "0"]} textAlign="center">
          Télécharger le fichier des entreprises au {date}
        </Text>

        <LinkBox>
          <LinkOverlay href="/index-egalite-fh.xlsx">
            <ButtonAction variant="outline" leftIcon={<HiDownload />} label="Télécharger (Excel)" />
          </LinkOverlay>
        </LinkBox>
      </Flex>
    </Center>
  ) : null;
}

const HomePage: NextPageWithLayout = () => {
  return (
    <VStack spacing={["3", "6"]}>
      <FormSearchSiren />
      <Box h="8" />

      <DownloadFileZone />

      <AverageIndicator />

      <Text
        fontSize="lg"
        as="div"
        sx={{
          a: {
            background: "none !important", // This is a hack to override the global css of dsfr on buttons.
          },
          "a:after": {
            display: "none !important",
          },
        }}
      >
        <TextLink to="/representation-equilibree/recherche" isExternal>
          Rechercher la représentation équilibrée d'une entreprise
        </TextLink>
      </Text>
      <Box />
    </VStack>
  );
};

HomePage.getLayout = ({ children }) => <ConsulterIndexLayout title="Recherche">{children}</ConsulterIndexLayout>;

export default HomePage;
