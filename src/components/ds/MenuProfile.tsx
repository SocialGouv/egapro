import React from "react"

import { Avatar } from "@chakra-ui/avatar"
import { Menu, MenuButton, MenuDivider, MenuItem, MenuList } from "@chakra-ui/menu"
import { Link } from "react-router-dom"

export function MenuProfile() {
  //   const tokenInfoLS = localStorage.getItem("tokenInfo")
  //   const tokenInfo = tokenInfoLS ? JSON.parse(tokenInfoLS) : null

  return (
    <Menu>
      <MenuButton mr={4}>
        <Avatar size="sm" />
      </MenuButton>

      {/*
Ajouter le lien vers Mes entreprises.

La page doit permettre de voir la lsite des SIREN et pour chacun, la liste des responsables.

Ensuite, avoir un bouton pour ajouter un responsable, qui va envoyer un mail et ajouter la personne en db.
Et des boutons supprimer pour chaque responsable. Afficher une modale pour confirmer.

Régle métier : Vérifier qu'il y a toujours au moins un responsable.

*/}

      <MenuList>
        <MenuItem>
          <Link to="/mon-profil">Mon Profil</Link>
        </MenuItem>

        <MenuItem>
          <Link to="/mes-entreprises">Mes entreprises</Link>
        </MenuItem>
        <MenuItem>Mes déclarations</MenuItem>
        <MenuDivider />
        <MenuItem>Déconnexion</MenuItem>
      </MenuList>
    </Menu>
  )
}
