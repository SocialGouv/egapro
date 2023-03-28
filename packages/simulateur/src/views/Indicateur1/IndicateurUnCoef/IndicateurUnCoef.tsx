import { Box, Tab, TabList, TabPanel, TabPanels, Tabs, Tag } from "@chakra-ui/react"
import React, { FunctionComponent, useEffect, useState } from "react"

import { useScrollTo } from "../../../components/ScrollContext"

import IndicateurUnCoefEffectifForm from "./IndicateurUnCoefEffectifForm"
import IndicateurUnCoefGroupForm from "./IndicateurUnCoefGroupForm"
import IndicateurUnCoefRemuForm from "./IndicateurUnCoefRemuForm"
import calculerIndicateurUn from "../../../utils/calculsEgaProIndicateurUn"
import { useAppStateContextProvider } from "../../../hooks/useAppStateContextProvider"

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

const IndicateurUnCoefContext = React.createContext<ReturnType<typeof calculerIndicateurUn> | Record<string, never>>({})
IndicateurUnCoefContext.displayName = "IndicateurUnCoefContext"

export const useIndicateurUnCoefContext = () => {
  const context = React.useContext(IndicateurUnCoefContext)

  if (!context) throw new Error("useIndicateurUnCoefContext must be used within IndicateurUnCoefContext")

  return context
}

export type TabIndicateurUnCoef = "Groupe" | "Effectif" | "Remuneration"

const IndicateurUnCoef: FunctionComponent = () => {
  const { state } = useAppStateContextProvider()

  const [tabIndex, setTabIndex] = useState(0)

  const calculsIndicateurUn: ReturnType<typeof calculerIndicateurUn> | Record<string, never> = state
    ? calculerIndicateurUn(state)
    : {}

  const indicateurCalculable = state ? calculsIndicateurUn.effectifsIndicateurCalculable : undefined

  useEffect(() => {
    // On mount, if indicateur 1 is NC, show the tab Rémunérations, only when effectifs tab is already validated, to not show it from start.
    if (state?.indicateurUn?.coefficientEffectifFormValidated === "Valid" && indicateurCalculable === false) {
      setTabIndex(2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <IndicateurUnCoefContext.Provider value={{ ...calculsIndicateurUn }}>
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
    </IndicateurUnCoefContext.Provider>
  )
}

export default IndicateurUnCoef
