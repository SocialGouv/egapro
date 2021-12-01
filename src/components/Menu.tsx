import React, { Fragment } from "react"
import { Switch, Route, Link as ReachLink } from "react-router-dom"
import { Box, Text, List, ListItem, Link } from "@chakra-ui/react"
import { FormState, TrancheEffectifs } from "../globals"
import globalStyles from "../utils/globalStyles"
import { IconValid, IconInvalid } from "./Icons"

interface CustomNavLinkProps {
  title: string
  label?: string
  valid?: FormState
  to: string
  activeOnlyWhenExact?: boolean
}

function buildA11yTitle({
  title,
  label,
  isValid,
  isCurrentStep,
}: {
  title: string
  label?: string
  isValid?: boolean
  isCurrentStep?: boolean
}): string {
  return `${title}${label ? ` ${label}` : ""}${isValid ? " : étape complétée" : ""}${
    isCurrentStep ? " : étape en cours" : ""
  }`
}

function CustomNavLink({ title, label, valid = "None", to, activeOnlyWhenExact = false }: CustomNavLinkProps) {
  return (
    <Route
      path={to}
      exact={activeOnlyWhenExact}
      // eslint-disable-next-line react/no-children-prop
      children={({ match }) => (
        <Link
          fontSize="sm"
          sx={{
            lineHeight: 1.25,
            display: "inline-flex",
            color: match ? globalStyles.colors.primary : "inherit",
          }}
          as={ReachLink}
          to={to}
          aria-label={buildA11yTitle({
            title,
            label,
            isValid: valid === "Valid",
            isCurrentStep: Boolean(match),
          })}
        >
          {valid === "Valid" ? (
            <Box mr={1} pt={1} cx={{ flexShrink: 0 }}>
              <IconValid />
            </Box>
          ) : valid === "Invalid" ? (
            <Box mr={2} pt={1} cx={{ flexShrink: 0 }}>
              <IconInvalid />
            </Box>
          ) : null}
          <Box cx={{ flexGrow: 1 }}>
            {title}
            {label && <Box>{label}</Box>}
          </Box>
        </Link>
      )}
    />
  )
}

interface Props {
  trancheEffectifs: TrancheEffectifs
  informationsFormValidated: FormState
  effectifFormValidated: FormState
  indicateurUnFormValidated: FormState
  indicateurDeuxFormValidated: FormState
  indicateurTroisFormValidated: FormState
  indicateurDeuxTroisFormValidated: FormState
  indicateurQuatreFormValidated: FormState
  indicateurCinqFormValidated: FormState
  informationsEntrepriseFormValidated: FormState
  informationsDeclarantFormValidated: FormState
  declarationFormValidated: FormState
}

function Menu({
  trancheEffectifs,
  informationsFormValidated,
  effectifFormValidated,
  indicateurUnFormValidated,
  indicateurDeuxFormValidated,
  indicateurDeuxTroisFormValidated,
  indicateurTroisFormValidated,
  indicateurQuatreFormValidated,
  indicateurCinqFormValidated,
  informationsEntrepriseFormValidated,
  informationsDeclarantFormValidated,
  declarationFormValidated,
}: Props) {
  return (
    <Box as="nav" role="navigation" bg={{ base: "#fff", xl: "transparent" }} px={4} py={{ base: 6, xl: 4 }}>
      <Switch>
        <Route
          path="/simulateur/:code"
          render={({
            match: {
              params: { code },
            },
          }) => (
            <React.Fragment>
              <CustomNavLink to={`/simulateur/${code}`} title="vos informations" activeOnlyWhenExact={true} />
              <Text fontSize="lg" mb={2} mt={3}>
                Calcul de l'index
              </Text>
              <List spacing={2}>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/informations`}
                    title="informations calcul"
                    label="et période de référence"
                    valid={informationsFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/effectifs`}
                    title="effectifs"
                    label="pris en compte"
                    valid={effectifFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur1`}
                    title="indicateur"
                    label="écart de rémunération"
                    valid={indicateurUnFormValidated}
                  />
                </ListItem>
                {(trancheEffectifs !== "50 à 250" && (
                  <Fragment>
                    <ListItem>
                      <CustomNavLink
                        to={`/simulateur/${code}/indicateur2`}
                        title="indicateur"
                        label="écart de taux d'augmentation"
                        valid={indicateurDeuxFormValidated}
                      />
                    </ListItem>
                    <ListItem>
                      <CustomNavLink
                        to={`/simulateur/${code}/indicateur3`}
                        title="indicateur"
                        label="écart de taux de promotion"
                        valid={indicateurTroisFormValidated}
                      />
                    </ListItem>
                  </Fragment>
                )) || (
                  <ListItem>
                    <CustomNavLink
                      to={`/simulateur/${code}/indicateur2et3`}
                      title="indicateur"
                      label="écart de taux d'augmentation"
                      valid={indicateurDeuxTroisFormValidated}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur4`}
                    title="indicateur"
                    label="retour congé maternité"
                    valid={indicateurQuatreFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur5`}
                    title="indicateur"
                    label="hautes rémunérations"
                    valid={indicateurCinqFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink to={`/simulateur/${code}/recapitulatif`} title="récapitulatif" />
                </ListItem>
              </List>
              <Text fontSize="lg" mb={2} mt={3}>
                Déclaration
              </Text>
              <List spacing={2}>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/informations-entreprise`}
                    title="informations entreprise/UES"
                    valid={informationsEntrepriseFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/informations-declarant`}
                    title="informations déclarant"
                    valid={informationsDeclarantFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/declaration`}
                    title="déclaration"
                    valid={declarationFormValidated}
                  />
                </ListItem>
              </List>
            </React.Fragment>
          )}
        />
      </Switch>
    </Box>
  )
}

export default Menu
