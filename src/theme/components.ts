import { StyleFunctionProps } from "@chakra-ui/theme-tools"
import defaultTheme from "@chakra-ui/theme"

const components = {
  components: {
    Button: {
      baseStyle: {
        fontWeight: "normal",
      },
    },

    Heading: {
      baseStyle: {
        fontWeight: "semibold",
        color: "gray.800",
      },
    },

    Input: {
      variants: {
        outline: (props: StyleFunctionProps) => ({
          ...defaultTheme.components.Input.variants.outline(props),
          field: {
            ...defaultTheme.components.Input.variants.outline(props).field,
            borderColor: "gray.400",
            background: "white",
            _readOnly: {
              background: "primary.200",
              borderColor: "transparent",
            },
          },
        }),
      },
    },

    Select: {
      variants: {
        outline: (props: StyleFunctionProps) => ({
          ...defaultTheme.components.Input.variants.outline(props),
          field: {
            ...defaultTheme.components.Input.variants.outline(props).field,
            borderColor: "gray.400",
            background: "white",
            _readOnly: {
              background: "primary.200",
              borderColor: "transparent",
            },
          },
        }),
      },
    },
  },
}

export default components
