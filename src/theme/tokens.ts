import { createBreakpoints } from "@chakra-ui/theme-tools"

const tokens = {
  fonts: {
    heading: "Cabin",
    body: "Cabin",
    custom: "Gabriela",
  },
  fontSizes: {
    xxs: "0.625rem",
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
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
    men: "#447F8D",
    women: "#886AA7",
    gray: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
    },
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
      900: "#333566",
    },
  },
}
export default tokens
