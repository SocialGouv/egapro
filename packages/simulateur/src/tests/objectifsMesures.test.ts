import { simulationWithIndex65 } from "../__fixtures__/simulation-index-65"
import { simulationWithIndex80 } from "../__fixtures__/simulation-index-80"

import { DeclarationAPI, buildDeclarationFromSimulation } from "../utils/declarationBuilder"
import { statusDeclaration } from "../components/DeclarationsListe"

describe("Status of declarations", () => {
  test("Status renseignés", () => {
    // 1. Build declaration from simulation
    const declarationAPI: DeclarationAPI = {
      siren: "825397516",
      year: 2021,
      data: buildDeclarationFromSimulation({
        id: "e1b52342-0e60-11ed-a33f-0242c0a82004",
        state: simulationWithIndex65.data,
      }),
      modified_at: 1656517469,
      declared_at: 1656407985,
    }

    const status = statusDeclaration(declarationAPI)

    // 2. Check that status is À renseigner.
    expect(status).toMatchInlineSnapshot(`"À renseigner"`)
  })

  test("Test when change in declaration on year makes the declaration status to 'Année non applicable'", () => {
    // 1. Build declaration from simulation
    const declarationAPI: DeclarationAPI = {
      siren: "825397516",
      year: 2021,
      data: buildDeclarationFromSimulation({
        id: "e1b52342-0e60-11ed-a33f-0242c0a82004",
        state: simulationWithIndex65.data,
      }),
      modified_at: 1656517469,
      declared_at: 1656407985,
    }

    let status = statusDeclaration(declarationAPI)
    expect(status).toMatchInlineSnapshot(`"À renseigner"`)
    expect(declarationAPI.data.déclaration.index).toMatchInlineSnapshot(`65`)
    expect(declarationAPI.data.entreprise.effectif.tranche).toMatchInlineSnapshot(`"50:250"`)

    // 3. This should be good for now. Remove a mandatory field now, to break the declaration.

    if (!declarationAPI.data.déclaration.publication) throw new Error("Missing publication field")

    declarationAPI.data.déclaration.année_indicateurs = 2020

    status = statusDeclaration(declarationAPI)

    expect(status).toMatchInlineSnapshot(`"Année non applicable"`)
  })
})

test("Test when change in declaration's index makes the declaration status to 'À renseigner'", () => {
  // 1. Build declaration from simulation
  const declarationAPI: DeclarationAPI = {
    siren: "825397516",
    year: 2021,
    data: buildDeclarationFromSimulation({
      id: "e1b52342-0e60-11ed-a33f-0242c0a82004",
      state: simulationWithIndex80.data,
    }),
    modified_at: 1656517469,
    declared_at: 1656407985,
  }

  let status = statusDeclaration(declarationAPI)

  expect(status).toMatchInlineSnapshot(`"À renseigner"`)
  expect(declarationAPI.data.déclaration.index).toMatchInlineSnapshot(`80`)
  expect(declarationAPI.data.entreprise.effectif.tranche).toMatchInlineSnapshot(`"50:250"`)

  // 3. This should be good for now. Remove a mandatory field now, to break the declaration.

  if (!declarationAPI.data.déclaration.publication) throw new Error("Missing publication field")
  declarationAPI.data.déclaration.index = 60

  status = statusDeclaration(declarationAPI)

  // 4. Must be "À renseigner" because datePublicationMesures is to be filled now.
  expect(status).toMatchInlineSnapshot(`"À renseigner"`)
})
