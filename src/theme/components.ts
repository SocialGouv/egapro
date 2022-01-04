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
        color: "gray.700",
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
        outlinePrimary: (props: StyleFunctionProps) => ({
          ...defaultTheme.components.Input.variants.outline(props),
          field: {
            ...defaultTheme.components.Input.variants.outline(props).field,
            borderColor: "primary.400",
            background: "primary.50",
            _hover: {
              borderColor: "primary.500",
            },
            _placeholder: {
              color: "primary.400",
            },
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
}

export default components
