import {
  expectedDeclarationWithNoPeriodeSuffisante,
  simulationWithNoPeriodeSuffisante,
} from "../__fixtures__/simulation-no-periode-suffisante"

import { formatDataForAPI } from "./declarationBuilder"

describe("A regular simulation has to be transformed in declaration", () => {
  test("Test 1", () => {
    const res = formatDataForAPI({
      id: "e1b52342-0e60-11ed-a33f-0242c0a82004",
      state: simulationWithNoPeriodeSuffisante.data,
    })

    expect(res).toEqual(expectedDeclarationWithNoPeriodeSuffisante)
  })
})
