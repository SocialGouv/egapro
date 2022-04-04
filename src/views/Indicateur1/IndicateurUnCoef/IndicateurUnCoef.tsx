import React, { FunctionComponent, useCallback, useState } from "react"
import { Tag, Box, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react"

import { AppState, FormState, ActionType, ActionIndicateurUnCoefData } from "../../../globals"

import { useScrollTo } from "../../../components/ScrollContext"

import IndicateurUnCoefGroupForm from "./IndicateurUnCoefGroupForm"
import IndicateurUnCoefEffectifForm from "./IndicateurUnCoefEffectifForm"
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

const IndicateurUnCoef: FunctionComponent<IndicateurUnCoefProps> = ({ state, dispatch }) => {
  const updateIndicateurUnCoefAddGroup = useCallback(
    () => dispatch({ type: "updateIndicateurUnCoefAddGroup" }),
    [dispatch],
  )

  const updateIndicateurUnCoefDeleteGroup = useCallback(
    (index: number) => dispatch({ type: "updateIndicateurUnCoefDeleteGroup", index }),
    [dispatch],
  )

  const updateIndicateurUnCoef = useCallback(
    (data: ActionIndicateurUnCoefData) => dispatch({ type: "updateIndicateurUnCoef", data }),
    [dispatch],
  )

  const validateIndicateurUnCoefGroup = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUnCoefGroup", valid }),
    [dispatch],
  )

  const validateIndicateurUnCoefEffectif = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUnCoefEffectif", valid }),
    [dispatch],
  )

  const validateIndicateurUn = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurUn", valid }),
    [dispatch],
  )

  const [tabIndex, setTabIndex] = useState(0)

  const scrollTo = useScrollTo()

  const navigateTo = (index: number) => {
    scrollTo(0)
    setTabIndex(index)
  }

  const navigateToGroupe = () => navigateTo(0)
  const navigateToEffectif = () => navigateTo(1)
  const navigateToRemuneration = () => navigateTo(2)

  return (
    <Tabs
      index={tabIndex}
      onChange={navigateTo}
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
          <IndicateurUnCoefGroupForm
            state={state}
            updateIndicateurUnCoefAddGroup={updateIndicateurUnCoefAddGroup}
            updateIndicateurUnCoefDeleteGroup={updateIndicateurUnCoefDeleteGroup}
            updateIndicateurUnCoef={updateIndicateurUnCoef}
            validateIndicateurUnCoefGroup={validateIndicateurUnCoefGroup}
            navigateToEffectif={navigateToEffectif}
            navigateToRemuneration={navigateToRemuneration}
          />
        </TabPanel>
        <TabPanel>
          <IndicateurUnCoefEffectifForm
            state={state}
            updateIndicateurUnCoef={updateIndicateurUnCoef}
            validateIndicateurUnCoefEffectif={validateIndicateurUnCoefEffectif}
            navigateToGroupe={navigateToGroupe}
            navigateToRemuneration={navigateToRemuneration}
          />
        </TabPanel>
        <TabPanel>
          <IndicateurUnCoefRemuForm
            state={state}
            updateIndicateurUnCoef={updateIndicateurUnCoef}
            validateIndicateurUn={validateIndicateurUn}
            navigateToEffectif={navigateToEffectif}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}

export default IndicateurUnCoef
