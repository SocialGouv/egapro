import { createBreakpoints } from "@chakra-ui/theme-tools"

const tokens = {
  breakpoints: createBreakpoints({
    sm: "30em",
    md: "48em",
    lg: "64rem",
    xl: "80rem",
    "2xl": "96em",
  }),
  sizes: {
    container: {
      xl: "1400px",
      lg: "1024px",
      md: "768px",
      sm: "640px",
    },
  },
  colors: {
    primary: {
      50: "#f8f8fd",
      100: "#f0f0fa",
      200: "#dadaf3",
      300: "#c3c4ec",
      400: "#9698de",
      500: "#696cd0",
      600: "#5f61bb",
      700: "#4f519c",
      800: "#3f417d",
      900: "red",
    },
  },
}
export default tokens
