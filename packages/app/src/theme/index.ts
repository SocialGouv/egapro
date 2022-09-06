import { extendTheme } from "@chakra-ui/react";

import { components } from "./components";
import { globals } from "./globals";
import { tokens } from "./tokens";

export const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  ...globals,
  ...tokens,
  ...components,
});
