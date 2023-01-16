import React, { Fragment } from "react"
import { Switch, Route, Link as ReachLink } from "react-router-dom"
import { Box, Heading, List, ListItem, Link } from "@chakra-ui/react"
import { FormState, TrancheEffectifs } from "../globals"
import globalStyles from "../utils/globalStyles"
import { IconValid, IconInvalid, IconQuestionMarkCircle } from "./ds/Icons"
import ButtonLink from "./ds/ButtonLink"

interface CustomNavLinkProps {
  title: string
  label?: string
  valid?: FormState
  to: string
  activeOnlyWhenExact?: boolean
  disabled?: boolean
  onClick?: () => void
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

function CustomNavLink({
  title,
  label,
  valid = "None",
  to,
  activeOnlyWhenExact = false,
  disabled = false,
  onClick,
}: CustomNavLinkProps) {
  if (disabled) {
    return (
      <Box
        fontSize="13"
        sx={{
          lineHeight: 1.125,
          display: "inline-flex",
          color: "inherit",
        }}
        cursor="not-allowed"
      >
        <Box sx={{ flexGrow: 1 }}>
          {title}
          {label && <Box>{label}</Box>}
        </Box>
      </Box>
    )
  }

  return (
    <Route
      path={to}
      exact={activeOnlyWhenExact}
      // eslint-disable-next-line react/no-children-prop
      children={({ match }) => (
        <Link
          onClick={onClick}
          fontSize="13"
          sx={{
            lineHeight: 1.125,
            display: "inline-flex",
            alignItems: "center",
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
            <Box mr={1} sx={{ flexShrink: 0, transform: "translateY(-1px)" }}>
              <IconValid color="green.400" />
            </Box>
          ) : valid === "Invalid" ? (
            <Box mr={2} sx={{ flexShrink: 0, transform: "translateY(-1px)" }}>
              <IconInvalid color="red.500" />
            </Box>
          ) : null}
          <Box sx={{ flexGrow: 1 }}>
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
  periodeSuffisante: boolean | undefined
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
  onClose?: () => void
}

function Menu({
  trancheEffectifs,
  periodeSuffisante,
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
  onClose,
}: Props) {
  const listStyles = {
    "@media (max-width: 1279px)": {
      li: {
        display: "flex",
      },
      a: {
        fontSize: "13px !important",
      },
    },
  }
  return (
    <Box
      as="nav"
      role="navigation"
      id="navigation"
      py={{ base: 0, md: 4, xl: 8 }}
      px={{ base: 0, md: 4, xl: 8 }}
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
              <List spacing={2} sx={listStyles}>
                <ListItem mb={6}>
                  <ButtonLink
                    to={`/aide-simulation`}
                    label="Consulter l'aide"
                    size="sm"
                    leftIcon={<IconQuestionMarkCircle />}
                    variant="outline"
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}`}
                    title="Vos informations"
                    activeOnlyWhenExact={true}
                    onClick={onClose}
                  />
                </ListItem>
              </List>

              <Heading as="div" size="sm" mb={3} mt={4}>
                Calcul de l'index
              </Heading>
              <List spacing={2} sx={listStyles}>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/informations`}
                    title="Informations calcul"
                    label="et période de référence"
                    valid={informationsFormValidated}
                    onClick={onClose}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/effectifs`}
                    title="Effectifs"
                    label="pris en compte"
                    valid={effectifFormValidated}
                    disabled={!periodeSuffisante}
                    onClick={onClose}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur1`}
                    title="Indicateur"
                    label="écart de rémunération"
                    valid={indicateurUnFormValidated}
                    disabled={!periodeSuffisante}
                    onClick={onClose}
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
                        disabled={!periodeSuffisante}
                        onClick={onClose}
                      />
                    </ListItem>
                    <ListItem>
                      <CustomNavLink
                        to={`/simulateur/${code}/indicateur3`}
                        title="Indicateur"
                        label="écart de taux de promotion"
                        valid={indicateurTroisFormValidated}
                        disabled={!periodeSuffisante}
                        onClick={onClose}
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
                      disabled={!periodeSuffisante}
                      onClick={onClose}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur4`}
                    title="Indicateur"
                    label="retour congé maternité"
                    valid={indicateurQuatreFormValidated}
                    disabled={!periodeSuffisante}
                    onClick={onClose}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/indicateur5`}
                    title="Indicateur"
                    label="hautes rémunérations"
                    valid={indicateurCinqFormValidated}
                    disabled={!periodeSuffisante}
                    onClick={onClose}
                  />
                </ListItem>

                <ListItem>
                  <CustomNavLink to={`/simulateur/${code}/recapitulatif`} title="Récapitulatif" onClick={onClose} />
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
                    onClick={onClose}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/informations-declarant`}
                    title="Informations déclarant"
                    valid={informationsDeclarantFormValidated}
                    onClick={onClose}
                  />
                </ListItem>
                <ListItem>
                  <CustomNavLink
                    to={`/simulateur/${code}/declaration`}
                    title="Déclaration"
                    valid={declarationFormValidated}
                    onClick={onClose}
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
