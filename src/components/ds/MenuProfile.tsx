import React from "react"
import { useHistory } from "react-router-dom"

import { Avatar } from "@chakra-ui/avatar"
import { Menu, MenuButton, MenuDivider, MenuItem, MenuList } from "@chakra-ui/menu"
import { Link as RouterLink } from "react-router-dom"
import { Link } from "@chakra-ui/react"
import { useUser } from "../AuthContext"

type MenuLinkProps = {
  children: React.ReactNode
  to: string
}

function MenuLink({ children, to }: MenuLinkProps) {
  return (
    <Link as={RouterLink} to={to} color="gray.600" _hover={{ textDecoration: "none" }}>
      {children}
    </Link>
  )
}

export function MenuProfile() {
  const history = useHistory()
  const { email, logout } = useUser()

  function deconnectUser() {
    logout()

    history.go(0)
  }

  return (
    <Menu>
      <MenuButton mr={4}>
        <Avatar size="sm" />
      </MenuButton>

      <MenuList>
        {!email ? (
          <MenuItem>
            <MenuLink to="/tableauDeBord/me-connecter">Me connecter</MenuLink>
          </MenuItem>
        ) : (
          <React.Fragment>
            <MenuItem>
              <MenuLink to="/tableauDeBord/mon-profil">Mon Profil</MenuLink>
            </MenuItem>

            <MenuItem>
              <MenuLink to="/tableauDeBord/mes-entreprises">Mes entreprises</MenuLink>
            </MenuItem>
            <MenuDivider />
            <MenuItem onClick={deconnectUser}>Déconnexion</MenuItem>
          </React.Fragment>
        )}
      </MenuList>
    </Menu>
  )
}
