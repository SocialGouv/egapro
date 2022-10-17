import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { Grid, GridCol } from "@/design-system";

export default {
  title: "Base/Grid",
  component: Grid,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://www.systeme-de-design.gouv.fr/elements-d-interface/fondamentaux-techniques/grille-et-points-de-rupture" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof Grid>;

export const Default: ComponentStory<typeof Grid> = args => (
  <Grid haveGutters {...args}>
    <GridCol sm={6} md={6} lg={4} xl={6}>
      <div style={{ height: 60, backgroundColor: "red" }} />
    </GridCol>
    <GridCol sm={6} md={6} lg={4} xl={6}>
      <div style={{ height: 60, backgroundColor: "red" }} />
    </GridCol>
    <GridCol sm={4} md={3} lg={4} xl={6}>
      <div style={{ height: 60, backgroundColor: "red" }} />
    </GridCol>
    <GridCol sm={4} md={3} lg={4} xl={6}>
      <div style={{ height: 60, backgroundColor: "red" }} />
    </GridCol>
    <GridCol sm={4} md={3} lg={4} xl={12}>
      <div style={{ height: 60, backgroundColor: "red" }} />
    </GridCol>
    <GridCol md={3} lg={4} xl={12}>
      <div style={{ height: 60, backgroundColor: "red" }} />
    </GridCol>
  </Grid>
);
