import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { TileSuccess, TileSuccessTitle } from "@design-system";

export default {
  title: "Base/TileSuccess",
  component: TileSuccess,
} as ComponentMeta<typeof TileSuccess>;

export const Default: ComponentStory<typeof TileSuccess> = () => {
  return (
    <TileSuccess>
      <TileSuccessTitle titleAs="h1">Lorem ipsum dolor sit amet</TileSuccessTitle>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Exercitationem dolorem esse corrupti ad soluta aperiam,
        ipsam voluptate quaerat odit voluptatibus asperiores obcaecati voluptatum nostrum atque enim sint. Fuga, odio
        eum!
      </p>
    </TileSuccess>
  );
};
