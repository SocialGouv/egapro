import React, { ReactElement } from "react"
import { RouteComponentProps, withRouter } from "react-router-dom"

import ButtonLink from "./ds/ButtonLink"
import TextLink from "./ds/TextLink"

interface MatchParams {
  code: string
}

interface SimulatorLinkProps extends RouteComponentProps<MatchParams> {
  children: (to: string) => ReactElement
}

function SimulatorLink({
  children,
  match: {
    params: { code },
  },
}: SimulatorLinkProps) {
  return children(`/simulateur/${code}`)
}

const SimulatorLinkWithRouter = withRouter(SimulatorLink)

export default SimulatorLinkWithRouter

interface LinkProps {
  label: string
  to: string
  fullWidth?: boolean
}

export function ButtonSimulatorLink({ to, label, fullWidth }: LinkProps) {
  return (
    <SimulatorLinkWithRouter>
      {(toSimulator) => <ButtonLink fullWidth={fullWidth} to={`${toSimulator}${to}`} label={label} size="lg" />}
    </SimulatorLinkWithRouter>
  )
}

export function TextSimulatorLink({ to, label }: LinkProps) {
  return (
    <SimulatorLinkWithRouter>
      {(toSimulator) => <TextLink to={`${toSimulator}${to}`}>{label}</TextLink>}
    </SimulatorLinkWithRouter>
  )
}
