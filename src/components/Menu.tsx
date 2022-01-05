import React, { Fragment } from "react"
import { Switch, Route, Link as ReachLink } from "react-router-dom"
import { Box, Heading, List, ListItem, Link } from "@chakra-ui/react"
import { FormState, TrancheEffectifs } from "../globals"
import globalStyles from "../utils/globalStyles"
import { IconValid, IconInvalid } from "./ds/Icons"

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
  const listStyles = {
    "@media (max-width: 1279px)": {
      li: {
        marginTop: "0 !important",
      },
      a: {
        fontSize: "13px !important",
      },
      "li:not(:last-child)": {
        marginRight: 4,
      },
    },
  }
  return (
    <Box
      as="nav"
      role="navigation"
      id="navigation"
      py={{ base: 4, xl: 8 }}
      px={4}
      sx={{
        position: "sticky",
        top: "0",
      }}
    >
      <Switch>
        <Route
          path="/simulateur/:code"
          render={({
            match: {
              params: { code },
            },
          }) => (
            <React.Fragment>
              <CustomNavLink to={`/simulateur/${code}`} title="Vos informations" activeOnlyWhenExact={true} />
              <Heading as="div" size="sm" mb={2} mt={4}>
                Calcul de l'index
              </Heading>
              <List spacing={2} sx={listStyles}>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/informations`}
                    title="Informations calcul"
                    label="et période de référence"
                    valid={informationsFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/effectifs`}
                    title="Effectifs"
                    label="pris en compte"
                    valid={effectifFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur1`}
                    title="Indicateur"
                    label="écart de rémunération"
                    valid={indicateurUnFormValidated}
                  />
                </ListItem>
                {(trancheEffectifs !== "50 à 250" && (
                  <Fragment>
                    <ListItem>
                      <CustomNavLink
                        to={`/simulateur/${code}/indicateur2`}
                        title="Indicateur"
                        label="écart de taux d'augmentation"
                        valid={indicateurDeuxFormValidated}
                      />
                    </ListItem>
                    <ListItem>
                      <CustomNavLink
                        to={`/simulateur/${code}/indicateur3`}
                        title="Indicateur"
                        label="écart de taux de promotion"
                        valid={indicateurTroisFormValidated}
                      />
                    </ListItem>
                  </Fragment>
                )) || (
                  <ListItem>
                    <CustomNavLink
                      to={`/simulateur/${code}/indicateur2et3`}
                      title="Indicateur"
                      label="écart de taux d'augmentation"
                      valid={indicateurDeuxTroisFormValidated}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur4`}
                    title="Indicateur"
                    label="retour congé maternité"
                    valid={indicateurQuatreFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur5`}
                    title="Indicateur"
                    label="hautes rémunérations"
                    valid={indicateurCinqFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink to={`/simulateur/${code}/recapitulatif`} title="Récapitulatif" />
                </ListItem>
              </List>
              <Heading as="div" size="sm" mb={2} mt={4}>
                Déclaration
              </Heading>
              <List spacing={2} sx={listStyles}>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/informations-entreprise`}
                    title="Informations entreprise/UES"
                    valid={informationsEntrepriseFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/informations-declarant`}
                    title="Informations déclarant"
                    valid={informationsDeclarantFormValidated}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/declaration`}
                    title="Déclaration"
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
