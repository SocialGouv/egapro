import { extendTheme, type ThemeConfig } from "@chakra-ui/react"
import tokens from "./tokens"
import globals from "./globals"
import components from "./components"

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  ...globals,
  ...tokens,
  ...components,
})

export default theme
