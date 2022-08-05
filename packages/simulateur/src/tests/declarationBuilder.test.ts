import { buildDeclarationFromSimulation } from "../utils/declarationBuilder"
import { expectedDeclarationWithIndex65, simulationWithIndex65 } from "../__fixtures__/simulation-index-65"
import { expectedDeclarationWithIndex80, simulationWithIndex80 } from "../__fixtures__/simulation-index-80"
import {
  expectedDeclarationWithNoPeriodeSuffisante,
  simulationWithNoPeriodeSuffisante,
} from "../__fixtures__/simulation-no-periode-suffisante"

describe("A regular simulation transformed in declaration", () => {
  test("Test for a simulation with not periode suffisante", () => {
    const declaration = buildDeclarationFromSimulation({
      id: "e1b52342-0e60-11ed-a33f-0242c0a82004",
      state: simulationWithNoPeriodeSuffisante.data,
    })

    expect(declaration).toEqual(expectedDeclarationWithNoPeriodeSuffisante)

    expect(declaration.déclaration.index).toMatchInlineSnapshot(`undefined`)
    expect(declaration.entreprise.effectif.tranche).toMatchInlineSnapshot(`"50:250"`)
  })

  test("Test for a simulation with index of 65", () => {
    const declaration = buildDeclarationFromSimulation({
      id: "e1b52342-0e60-11ed-a33f-0242c0a82004",
      state: simulationWithIndex65.data,
    })

    expect(declaration).toEqual(expectedDeclarationWithIndex65)
    expect(declaration.déclaration.index).toMatchInlineSnapshot(`65`)
    expect(declaration.entreprise.effectif.tranche).toMatchInlineSnapshot(`"50:250"`)
  })
  test("Test for a simulation with index of 80", () => {
    const declaration = buildDeclarationFromSimulation({
      id: "ea1709b4-0db7-11ed-86ff-0242c0a82004",
      state: simulationWithIndex80.data,
    })

    expect(declaration).toEqual(expectedDeclarationWithIndex80)
    expect(declaration.déclaration.index).toMatchInlineSnapshot(`80`)
    expect(declaration.entreprise.effectif.tranche).toMatchInlineSnapshot(`"50:250"`)
  })
})
