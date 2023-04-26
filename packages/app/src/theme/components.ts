import { type StyleFunctionProps } from "@chakra-ui/theme-tools";

export const components = {
  components: {
    Button: {
      baseStyle: {
        fontWeight: "normal",
      },
    },

    Heading: {
      baseStyle: {
        fontWeight: "semibold",
      },
    },
    Input: {
      baseStyle: (props: StyleFunctionProps) => ({
        field: {
          _placeholder: {
            color: props.colorMode === "dark" ? "gray.400" : "gray.500",
          },
        },
      }),
    },

    Table: {
      sizes: {
        sm: {
          th: {
            px: "2",
            py: "2",
            lineHeight: "1",
            fontSize: "xs",
          },
          td: {
            px: "2",
            py: "1.5",
            fontSize: "sm",
            lineHeight: "1",
          },
          caption: {
            px: "1",
            py: "2",
            fontSize: "xs",
          },
        },
      },
    },
  },
};
