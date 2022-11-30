import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { TileCompanyRepeqs } from "@design-system";

export default {
  title: "Base/TileCompanyRepeqs",
  component: TileCompanyRepeqs,
} as ComponentMeta<typeof TileCompanyRepeqs>;

export const Default: ComponentStory<typeof TileCompanyRepeqs> = () => {
  return (
    <TileCompanyRepeqs
      title="EDF PEI production électrique insulaire SAS SIEGE"
      siren="489967687"
      location="Hauts-de-Seine, Île-de-France"
      data={[
        { year: 2022, executivesManagers: { women: 55, men: 45 }, governingMembers: { women: 25, men: 75 } },
        { year: 2021, executivesManagers: { women: 32, men: 67 }, governingMembers: { women: 10, men: 90 } },
        {
          year: 2020,
          executivesManagers: { women: 30, men: 70 },
          governingMembers: { women: undefined, men: undefined },
        },
        {
          year: 2019,
          executivesManagers: { women: 24, men: 76 },
          governingMembers: { women: undefined, men: undefined },
        },
      ]}
    />
  );
};

export const withButtonLoadMore: ComponentStory<typeof TileCompanyRepeqs> = () => {
  return (
    <TileCompanyRepeqs
      title="EDF PEI production électrique insulaire SAS SIEGE"
      siren="489967687"
      location="Hauts-de-Seine, Île-de-France"
      data={[
        { year: 2022, executivesManagers: { women: 55, men: 45 }, governingMembers: { women: 25, men: 75 } },
        { year: 2021, executivesManagers: { women: 32, men: 67 }, governingMembers: { women: 10, men: 90 } },
        {
          year: 2020,
          executivesManagers: { women: 30, men: 70 },
          governingMembers: { women: undefined, men: undefined },
        },
        {
          year: 2019,
          executivesManagers: { women: 24, men: 76 },
          governingMembers: { women: undefined, men: undefined },
        },
        {
          year: 2018,
          executivesManagers: { women: 23, men: 77 },
          governingMembers: { women: undefined, men: undefined },
        },
        {
          year: 2017,
          executivesManagers: { women: 12, men: 88 },
          governingMembers: { women: undefined, men: undefined },
        },
      ]}
    />
  );
};
