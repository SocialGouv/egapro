import React from "react"

import { Avatar } from "@chakra-ui/avatar"
import { Menu, MenuButton, MenuDivider, MenuItem, MenuList } from "@chakra-ui/menu"
import { Link as RouterLink } from "react-router-dom"
import { Link } from "@chakra-ui/react"
import { useUser } from "../../utils/hooks"

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
  const { email } = useUser()

  return (
    <Menu>
      <MenuButton mr={4}>
        <Avatar size="sm" />
      </MenuButton>

      <MenuList>
        {!email ? (
          <MenuItem>
            <MenuLink to="/me-connecter">Me connecter</MenuLink>
          </MenuItem>
        ) : (
          <React.Fragment>
            <MenuItem>
              <MenuLink to="/mon-profil">Mon Profil</MenuLink>
            </MenuItem>

            <MenuItem>
              <MenuLink to="/mes-entreprises">Mes entreprises</MenuLink>
            </MenuItem>
            <MenuDivider />
            <MenuItem>Déconnexion</MenuItem>
          </React.Fragment>
        )}
      </MenuList>
    </Menu>
  )
}
