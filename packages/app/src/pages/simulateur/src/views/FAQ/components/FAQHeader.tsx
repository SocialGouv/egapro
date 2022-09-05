import React, { FunctionComponent, useMemo } from "react"
import { Box, Button, Heading } from "@chakra-ui/react"
import { useRouter } from "next/router"
import NextLink from "next/link"
import { IconBack } from "../../../components/ds/Icons"

export type FAQHeaderProps = {
  closeMenu?: () => void
  location?: { pathname: string; search: string; hash: string; state: undefined } // toRemove
}

const FAQHeaderBackButton = ({ onClick }: { onClick: () => void }) => (
  <Button onClick={onClick} size="xs" leftIcon={<IconBack />} variant="link">
    Retour
  </Button>
)

const FAQHeaderHomeButton = () => (
  <NextLink href="/simulateur/home">
    <Button size="xs" leftIcon={<IconBack />} variant="link">
      Voir toute l’aide
    </Button>
  </NextLink>
)

const FAQHeader: FunctionComponent<FAQHeaderProps> = ({ closeMenu }) => {
  const router = useRouter()
  const { query: section } = router
  const pathname = useMemo(() => router?.pathname, [router])

  return (
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
        {closeMenu && pathname === "/simulateur/Home" && <FAQHeaderBackButton onClick={closeMenu} />}

        {section && <FAQHeaderHomeButton />}
        {/*
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
  */}
      </Box>
      <Heading as="h2" fontFamily="custom" fontWeight="medium" size="md" color="gray.700">
        Aide
      </Heading>
    </Box>
  )
}

export default FAQHeader
