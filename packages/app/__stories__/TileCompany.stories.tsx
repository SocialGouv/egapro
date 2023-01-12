import {
  TileCompany,
  TileCompanyLoadMore,
  TileCompanyLocation,
  TileCompanyPercent,
  TileCompanyPercentData,
  TileCompanySiren,
  TileCompanyTable,
  TileCompanyTableBody,
  TileCompanyTableBodyRow,
  TileCompanyTableBodyRowCol,
  TileCompanyTableHead,
  TileCompanyTableHeadCol,
  TileCompanyTitle,
  TileCompanyYear,
} from "@design-system";
import { action } from "@storybook/addon-actions";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Base/TileCompany",
  component: TileCompany,
} as ComponentMeta<typeof TileCompany>;

export const Default: ComponentStory<typeof TileCompany> = () => {
  return (
    <TileCompany>
      <TileCompanyTitle>EDF PEI production electrique insulaire SAS SIEGE</TileCompanyTitle>
      <TileCompanySiren>489967687</TileCompanySiren>
      <TileCompanyLocation>Hauts-de-Seine, Île-de-France</TileCompanyLocation>
      <TileCompanyTable>
        <TileCompanyTableHead>
          <TileCompanyTableHeadCol>Année</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Cadres dirigeants</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Membre instance dirigeante</TileCompanyTableHeadCol>
        </TileCompanyTableHead>
        <TileCompanyTableBody>
          <TileCompanyTableBodyRow>
            <TileCompanyTableBodyRowCol>
              <TileCompanyYear year={2022} />
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={45} legend="Femmes" />
                <TileCompanyPercentData number={55} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={48} legend="Femmes" />
                <TileCompanyPercentData number={52} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
          </TileCompanyTableBodyRow>
          <TileCompanyTableBodyRow>
            <TileCompanyTableBodyRowCol>
              <TileCompanyYear year={2021} />
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={27} legend="Femmes" />
                <TileCompanyPercentData number={73} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={null} legend="Femmes" />
                <TileCompanyPercentData number={null} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
          </TileCompanyTableBodyRow>
        </TileCompanyTableBody>
      </TileCompanyTable>
    </TileCompany>
  );
};

export const ShowMoreRow: ComponentStory<typeof TileCompany> = () => {
  return (
    <TileCompany>
      <TileCompanyTitle>EDF PEI production electrique insulaire SAS SIEGE</TileCompanyTitle>
      <TileCompanySiren>489967687</TileCompanySiren>
      <TileCompanyLocation>Hauts-de-Seine, Île-de-France</TileCompanyLocation>
      <TileCompanyTable>
        <TileCompanyTableHead>
          <TileCompanyTableHeadCol>Année</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Cadres dirigeants</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Membre instance dirigeante</TileCompanyTableHeadCol>
        </TileCompanyTableHead>
        <TileCompanyTableBody>
          <TileCompanyTableBodyRow>
            <TileCompanyTableBodyRowCol>
              <TileCompanyYear year={2022} />
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={45} legend="Femmes" />
                <TileCompanyPercentData number={55} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={48} legend="Femmes" />
                <TileCompanyPercentData number={52} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
          </TileCompanyTableBodyRow>
          <TileCompanyTableBodyRow>
            <TileCompanyTableBodyRowCol>
              <TileCompanyYear year={2021} />
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={65} legend="Femmes" />
                <TileCompanyPercentData number={35} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={null} legend="Femmes" />
                <TileCompanyPercentData number={null} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
          </TileCompanyTableBodyRow>
          <TileCompanyTableBodyRow>
            <TileCompanyTableBodyRowCol>
              <TileCompanyYear year={2020} />
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={90} legend="Femmes" />
                <TileCompanyPercentData number={10} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={45} legend="Femmes" />
                <TileCompanyPercentData number={55} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
          </TileCompanyTableBodyRow>
          <TileCompanyTableBodyRow>
            <TileCompanyTableBodyRowCol>
              <TileCompanyYear year={2019} />
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={40} legend="Femmes" />
                <TileCompanyPercentData number={60} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
            <TileCompanyTableBodyRowCol>
              <TileCompanyPercent>
                <TileCompanyPercentData number={45} legend="Femmes" />
                <TileCompanyPercentData number={55} legend="Hommes" />
              </TileCompanyPercent>
            </TileCompanyTableBodyRowCol>
          </TileCompanyTableBodyRow>
        </TileCompanyTableBody>
      </TileCompanyTable>
      <TileCompanyLoadMore onClick={action("button-click")} />
    </TileCompany>
  );
};
