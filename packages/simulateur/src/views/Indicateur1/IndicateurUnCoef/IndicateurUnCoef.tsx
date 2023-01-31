import { Box, Tab, TabList, TabPanel, TabPanels, Tabs, Tag } from "@chakra-ui/react"
import React, { FunctionComponent, useState } from "react"

import { ActionType, AppState } from "../../../globals"

import { useScrollTo } from "../../../components/ScrollContext"

import IndicateurUnCoefEffectifForm from "./IndicateurUnCoefEffectifForm"
import IndicateurUnCoefGroupForm from "./IndicateurUnCoefGroupForm"
import IndicateurUnCoefRemuForm from "./IndicateurUnCoefRemuForm"

interface StepProps {
  step: number
  stepLength: number
  label: string
  isCurrentStep: boolean
}
const Step: FunctionComponent<StepProps> = ({ step, stepLength, label, isCurrentStep }) => (
  <Box>
    <Tag size="sm" colorScheme={isCurrentStep ? "primary" : "transparent"}>
      Étape {step}/{stepLength}
    </Tag>
    <Box fontWeight="semibold" fontSize="sm">
      {label}
    </Box>
  </Box>
)

interface IndicateurUnCoefProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

export type TabIndicateurUnCoef = "Groupe" | "Effectif" | "Remuneration"

const IndicateurUnCoef: FunctionComponent<IndicateurUnCoefProps> = ({ state, dispatch }) => {
  const [tabIndex, setTabIndex] = useState(0)

  const scrollTo = useScrollTo()

  const navigateToIndex = (index: number) => {
    scrollTo(0)
    setTabIndex(index)
  }

  const navigateTo = (tab: TabIndicateurUnCoef) => {
    if (tab === "Groupe") navigateToIndex(0)
    if (tab === "Effectif") navigateToIndex(1)
    if (tab === "Remuneration") navigateToIndex(2)
  }

  return (
    <Tabs
      index={tabIndex}
      onChange={navigateToIndex}
      colorScheme="primary"
      isFitted
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
    >
      <TabList>
        <Tab>
          <Step step={1} stepLength={3} label="Groupes" isCurrentStep={tabIndex === 0} />
        </Tab>
        <Tab>
          <Step step={2} stepLength={3} label="Effectifs physiques" isCurrentStep={tabIndex === 1} />
        </Tab>
        <Tab>
          <Step step={3} stepLength={3} label="Rémunérations" isCurrentStep={tabIndex === 2} />
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <IndicateurUnCoefGroupForm navigateTo={navigateTo} />
        </TabPanel>
        <TabPanel>
          <IndicateurUnCoefEffectifForm navigateTo={navigateTo} />
        </TabPanel>
        <TabPanel>
          <IndicateurUnCoefRemuForm navigateTo={navigateTo} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}

export default IndicateurUnCoef
