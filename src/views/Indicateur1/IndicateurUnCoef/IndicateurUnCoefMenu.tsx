/** @jsx jsx */
import { jsx, css } from "@emotion/core"

import { FormState } from "../../../globals"

import globalStyles from "../../../utils/globalStyles"

import { useColumnsWidth, useLayoutType } from "../../../components/GridContext"
import ActionLink from "../../../components/ActionLink"
import { IconValid, IconInvalid } from "../../../components/ds/Icons"

export type MenuOption = "groupe" | "effectif" | "remuneration"

interface Props {
  menuSelected: MenuOption
  setMenuSelected: (menu: MenuOption) => void
  coefficientGroupFormValidated: FormState
  coefficientEffectifFormValidated: FormState
  formValidated: FormState
}

function IndicateurUnCoefMenu({
  menuSelected,
  setMenuSelected,
  coefficientGroupFormValidated,
  coefficientEffectifFormValidated,
  formValidated,
}: Props) {
  const layoutType = useLayoutType()
  const width = useColumnsWidth(layoutType === "desktop" ? 6 : 7)
  return (
    <div css={[styles.menu, { width }]}>
      <MenuItem
        title="étape 1/3 : groupes"
        isSelected={menuSelected === "groupe"}
        formValidated={coefficientGroupFormValidated}
        onClick={() => setMenuSelected("groupe")}
      />
      <MenuItem
        title="étape 2/3 : effectifs physiques"
        isSelected={menuSelected === "effectif"}
        formValidated={coefficientEffectifFormValidated}
        onClick={() => setMenuSelected("effectif")}
      />
      <MenuItem
        title="étape 3/3 : rémunérations"
        isSelected={menuSelected === "remuneration"}
        formValidated={formValidated}
        onClick={() => setMenuSelected("remuneration")}
      />
    </div>
  )
}

function MenuItem({
  title,
  isSelected,
  onClick,
  formValidated,
}: {
  title: string
  isSelected: boolean
  formValidated: FormState
  onClick: () => void
}) {
  return (
    <ActionLink style={[styles.menuItem, isSelected && styles.menuItemSelected]} onClick={onClick}>
      {formValidated === "Valid" ? (
        <div css={styles.icon}>
          <IconValid />
        </div>
      ) : formValidated === "Invalid" ? (
        <div css={styles.icon}>
          <IconInvalid />
        </div>
      ) : null}
      <span>{title}</span>
    </ActionLink>
  )
}

const styles = {
  menu: css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
  }),
  menuItem: css({
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 200,
    borderBottom: `solid ${globalStyles.colors.default} 1px`,

    display: "flex",
    flexDirection: "row",
    alignItems: "center",

    fontSize: 14,
    lineHeight: "17px",
    textDecoration: "none",
    textAlign: "left",
  }),
  menuItemSelected: css({
    color: globalStyles.colors.primary,
    borderColor: globalStyles.colors.primary,
  }),
  icon: css({
    marginRight: 3,
  }),
}

export default IndicateurUnCoefMenu
