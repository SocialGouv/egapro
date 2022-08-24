import React, { FunctionComponent } from "react"
import { Box, Button, Heading } from "@chakra-ui/react"
import { Switch, Link, Route, RouteComponentProps } from "react-router-dom"
import { IconBack } from "../../../components/ds/Icons"

export type FAQHeaderProps = {
  location: RouteComponentProps["location"]
  closeMenu?: () => void
}

const FAQHeaderBackButton = ({ onClick }: { onClick: () => void }) => (
  <Button onClick={onClick} size="xs" leftIcon={<IconBack />} variant="link">
    Retour
  </Button>
)

const FAQHeaderHomeButton = () => (
  <Button as={Link} to={{ state: { faq: "/" } }} size="xs" leftIcon={<IconBack />} variant="link">
    Voir toute l’aide
  </Button>
)

const FAQHeader: FunctionComponent<FAQHeaderProps> = ({ location, closeMenu }) => (
  <Box
    height={20}
    mx={6}
    textAlign="center"
    borderBottom="1px solid"
    borderColor="gray.200"
    position="relative"
    display="flex"
    justifyContent="center"
    alignItems="center"
  >
    <Box position="absolute" top="50%" left={0} transform="translateY(calc(-50% + .125rem))" fontSize="xs">
      <Switch location={location}>
        {closeMenu && <Route exact path="/" render={() => <FAQHeaderBackButton onClick={closeMenu} />} />}
        <Route exact path="/section/:section" render={() => <FAQHeaderHomeButton />} />
        <Route
          exact
          path={["/part/:part/question/:indexQuestion", "/contact"]}
          render={({ history }) => <FAQHeaderBackButton onClick={() => history.goBack()} />}
        />
        <Route
          exact
          path="/section/:section/detail-calcul"
          render={({ history }) => <FAQHeaderBackButton onClick={() => history.goBack()} />}
        />
      </Switch>
    </Box>
    <Heading as="h2" fontFamily="custom" fontWeight="medium" size="md" color="gray.700">
      Aide
    </Heading>
  </Box>
)

export default FAQHeader
