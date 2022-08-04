import { Flex, FormControl, FormLabel, Select } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"
import { useHistory, useParams } from "react-router-dom"

import { useTitle } from "../../utils/hooks"

import { useUser } from "../../components/AuthContext"
import DeclarationsListe from "../../components/DeclarationsListe"
import InfoEntreprise from "../../components/InfoEntreprise"
import NoSiren from "../../components/ds/NoSiren"
import Page from "../../components/Page"
import { SinglePageLayout } from "../../containers/SinglePageLayout"

const title = "Mes déclarations"

const MesDeclarations: FunctionComponent = () => {
  useTitle(title)
  const history = useHistory()

  const { siren: sirenFromUrl } = useParams<{ siren?: string }>()

  const { ownership: sirens } = useUser()
  const orderedSirens = [...sirens].sort()

  const siren = sirenFromUrl || orderedSirens?.[0]

  return (
    <SinglePageLayout size="container.xl">
      <Page title={title}>
        {!sirens?.length ? (
          <NoSiren />
        ) : (
          <>
            <FormControl id="siren">
              <FormLabel>SIREN</FormLabel>
              <Select
                onChange={(event) => history.push(`/tableauDeBord/mes-declarations/${event?.target?.value}`)}
                defaultValue={siren}
                aria-label="Liste des SIREN"
              >
                {orderedSirens.map((siren) => (
                  <option key={siren} value={siren}>
                    {siren}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Flex mt="6" direction="column">
              <InfoEntreprise siren={siren} />
              <DeclarationsListe siren={siren} />
            </Flex>
          </>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default MesDeclarations
