import { StyleFunctionProps } from "@chakra-ui/theme-tools"
import defaultTheme from "@chakra-ui/theme"

const components = {
  components: {
    Button: {
      baseStyle: {
        fontWeight: "normal",
      },
    },
    Input: {
      variants: {
        "blue-outline": (props: StyleFunctionProps) => ({
          ...defaultTheme.components.Input.variants.outline(props),
          field: {
            ...defaultTheme.components.Input.variants.outline(props).field,
            border: "1px solid",
            borderColor: "blue.100",
          },
        }),
      },
    },
  },
}

export default components
