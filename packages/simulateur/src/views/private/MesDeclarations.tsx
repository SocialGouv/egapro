import { Box, Flex, FormControl, FormLabel, Select } from "@chakra-ui/react"
import React from "react"
import { useHistory, useParams } from "react-router-dom"

import { useTitle } from "../../utils/hooks"

import { useUser } from "../../components/AuthContext"
import DeclarationsListe from "../../components/DeclarationsListe"
import InfoEntreprise from "../../components/InfoEntreprise"
import NoSiren from "../../components/ds/NoSiren"
import Page from "../../components/Page"
import { SinglePageLayout } from "../../containers/SinglePageLayout"
import RepEqsListe from "../../components/RepEqsListe"
import InfoBlock from "../../components/ds/InfoBlock"

const title = "Mes déclarations"

const MesDeclarations = () => {
  useTitle(title)
  const history = useHistory()

  const { siren: sirenFromUrl } = useParams<{ siren?: string }>()

  const { ownership: sirens } = useUser()
  const orderedSirens = [...sirens].sort()

  const siren = sirenFromUrl || orderedSirens?.[0]

  return (
    <SinglePageLayout size="container.xl">
      <Page title={title}>
        <InfoBlock
          mb="2"
          text={
            <>
              <p>
                Dans ce menu, vous avez accès à la liste des déclarations de l’index de l’égalité professionnelle et, si
                vous êtes assujetti, de la représentation équilibrée qui ont été transmises à l’administration, en
                sélectionnant au préalable dans la liste déroulante le numéro Siren de l'entreprise concernée si vous
                gérez plusieurs entreprises.
              </p>
              <br />
              <p>
                Vous pouvez ainsi télécharger le récapitulatif de la déclaration à la colonne « <b>RÉCAP</b> », et en
                cliquant sur le Siren, vous accédez à la déclaration transmise. A la colonne «{" "}
                <b>OBJECTIFS ET MESURES</b> », vous avez accès à la déclaration des mesures de correction lorsque
                l’index est inférieur à 75 points et des objectifs de progression lorsque l’index est inférieur à 85
                points.
              </p>
            </>
          }
        />
        {!sirens?.length ? (
          <NoSiren />
        ) : (
          <>
            <Flex direction="column">
              <FormControl id="siren">
                <FormLabel>SIREN</FormLabel>
                <Flex direction="row" gap="4">
                  <Select
                    w="fit-content"
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
                  <Box flex="auto">
                    <InfoEntreprise siren={siren} />
                  </Box>
                </Flex>
              </FormControl>

              <Box mt="6">
                <DeclarationsListe siren={siren} />
              </Box>
              <Box mt="6">
                <RepEqsListe siren={siren} />
              </Box>
            </Flex>
          </>
        )}
      </Page>
    </SinglePageLayout>
  )
}

export default MesDeclarations
