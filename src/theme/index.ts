import { extendTheme } from "@chakra-ui/react"
import tokens from "./tokens"
import globals from "./globals"
import components from "./components"

const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  ...globals,
  ...tokens,
  ...components,
})

console.log(theme)

export default theme
