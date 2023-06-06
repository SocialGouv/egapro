import { MatomoPush } from "@components/utils/MatomoPush";
import { Box, Text } from "@design-system";

import DefaultLayout from "./(default)/layout";

const NotFound = () => (
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  <DefaultLayout>
    <MatomoPush event={["trackEvent", "404", "Page non trouvée"]} />
    <Box style={{ textAlign: "center" }} mt="8v">
      <Text variant="xl" text="Malheureusement la page que vous cherchez n'existe pas !" />
    </Box>
  </DefaultLayout>
);

export default NotFound;
