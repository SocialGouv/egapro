import React, { FunctionComponent } from "react"
import { useHistory, Link as RouterLink } from "react-router-dom"
import { Menu, MenuButton, MenuDivider, MenuItem, MenuList } from "@chakra-ui/menu"
import { Button, Link } from "@chakra-ui/react"

import { IconMenu } from "./Icons"
import { useUser } from "../AuthContext"
import ButtonLink from "./ButtonLink"

type MenuLinkProps = {
  children: React.ReactNode
  to: string
}

const MenuLink: FunctionComponent<MenuLinkProps> = ({ children, to }) => {
  return (
    <Link as={RouterLink} to={to} color="gray.600" _hover={{ textDecoration: "none" }}>
      {children}
    </Link>
  )
}

type MenuProfileProps = () => void

const MenuProfile: FunctionComponent<MenuProfileProps> = (openHelp) => {
  const history = useHistory()
  const { email, logout, staff } = useUser()

  const disconnectUser = () => {
    logout()
    history.go(0)
  }

  if (email) {
    return (
      <Menu>
        <MenuButton as={Button} variant="ghost" colorScheme="primary" leftIcon={<IconMenu boxSize={6} />}>
          Menu
        </MenuButton>
        <MenuList>
          <MenuItem onClick={openHelp}>Aide</MenuItem>
          <MenuItem>
            <MenuLink to="/tableauDeBord/mon-profil">Mon Profil</MenuLink>
          </MenuItem>
          <MenuItem>
            <MenuLink to="/tableauDeBord/mes-entreprises">Mes entreprises</MenuLink>
          </MenuItem>
          {staff && (
            <React.Fragment>
              <MenuDivider />
              <MenuItem>
                <MenuLink to="/tableauDeBord/gerer-utilisateurs">Gérer utilisateurs</MenuLink>
              </MenuItem>
              <MenuItem>
                <MenuLink to="/tableauDeBord/generer-token-utilisateur">Générer token</MenuLink>
              </MenuItem>
            </React.Fragment>
          )}
          <MenuDivider />
          <MenuItem onClick={disconnectUser} color="orange.500">
            Déconnexion
          </MenuItem>
        </MenuList>
      </Menu>
    )
  } else {
    return <ButtonLink to="/tableauDeBord/me-connecter" label="Me connecter" variant="ghost" colorScheme="primary" />
  }
}

export default MenuProfile
