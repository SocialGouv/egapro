import { ObjectifsMesuresFormSchema } from "../views/private/ObjectifsMesuresPage"
import { simulationWithIndex65 } from "../__fixtures__/simulation-index-65"
import { simulationWithIndex80 } from "../__fixtures__/simulation-index-80"

import {
  DeclarationAPI,
  buildDeclarationFromSimulation,
  updateDeclarationWithObjectifsMesures,
} from "../utils/declarationBuilder"
import { statusDeclaration } from "../components/DeclarationsListe"

const objectifsMesuresData: ObjectifsMesuresFormSchema = {
  objectifIndicateurQuatre: "12",
  objectifIndicateurDeuxTrois: "16",
  datePublicationMesures: "2022-06-30",
  datePublicationObjectifs: "2022-06-29",
  modalitesPublicationObjectifsMesures: "voici les modalités amendées",
}

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

    let status = statusDeclaration(declarationAPI)

    // 2. Check that status is À renseigner.
    expect(status).toMatchInlineSnapshot(`"À renseigner"`)
    expect(declarationAPI.data.déclaration.index).toMatchInlineSnapshot(`65`)
    expect(declarationAPI.data.entreprise.effectif.tranche).toMatchInlineSnapshot(`"50:250"`)

    // 3. Update declaration with correect objectifs and mesures
    const declarationWithOPMC = updateDeclarationWithObjectifsMesures(declarationAPI, objectifsMesuresData)

    status = statusDeclaration(declarationWithOPMC)

    // 4. Check that status is Renseignés.
    expect(status).toMatchInlineSnapshot(`"Renseignés"`)
  })

  test("Test when change in declaration makes the declaration status to 'À renseigner'", () => {
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

    // 2. Update declaration with objectifs and mesures
    const declarationWithOPMC = updateDeclarationWithObjectifsMesures(declarationAPI, objectifsMesuresData)

    let status = statusDeclaration(declarationWithOPMC)
    expect(status).toMatchInlineSnapshot(`"Renseignés"`)
    expect(declarationAPI.data.déclaration.index).toMatchInlineSnapshot(`65`)
    expect(declarationAPI.data.entreprise.effectif.tranche).toMatchInlineSnapshot(`"50:250"`)

    // 3. This should be good for now. Remove a mandatory field now, to break the declaration.

    if (!declarationWithOPMC.data.déclaration.publication) throw new Error("Missing publication field")
    declarationWithOPMC.data.déclaration.publication.date_publication_objectifs = undefined

    status = statusDeclaration(declarationWithOPMC)

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

    // 2. Update declaration with objectifs and mesures
    const declarationWithOPMC = updateDeclarationWithObjectifsMesures(declarationAPI, objectifsMesuresData)

    let status = statusDeclaration(declarationWithOPMC)
    expect(status).toMatchInlineSnapshot(`"Renseignés"`)
    expect(declarationAPI.data.déclaration.index).toMatchInlineSnapshot(`65`)
    expect(declarationAPI.data.entreprise.effectif.tranche).toMatchInlineSnapshot(`"50:250"`)

    // 3. This should be good for now. Remove a mandatory field now, to break the declaration.

    if (!declarationWithOPMC.data.déclaration.publication) throw new Error("Missing publication field")

    declarationWithOPMC.data.déclaration.année_indicateurs = 2020

    status = statusDeclaration(declarationWithOPMC)

    expect(status).toMatchInlineSnapshot(`"Année non applicable"`)
  })
})

// Only objectifs data because the index of the corresponding declaration will be 80.
const objectifsMesuresData2: ObjectifsMesuresFormSchema = {
  objectifIndicateurDeuxTrois: "26",
  objectifIndicateurCinq: "10",
  datePublicationObjectifs: "2022-06-29",
  modalitesPublicationObjectifsMesures: undefined,
}

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

  // 2. Update declaration with objectifs and mesures
  const declarationWithOPMC = updateDeclarationWithObjectifsMesures(declarationAPI, objectifsMesuresData2)

  let status = statusDeclaration(declarationWithOPMC)

  expect(status).toMatchInlineSnapshot(`"Renseignés"`)
  expect(declarationAPI.data.déclaration.index).toMatchInlineSnapshot(`80`)
  expect(declarationAPI.data.entreprise.effectif.tranche).toMatchInlineSnapshot(`"50:250"`)

  // 3. This should be good for now. Remove a mandatory field now, to break the declaration.

  if (!declarationWithOPMC.data.déclaration.publication) throw new Error("Missing publication field")
  declarationWithOPMC.data.déclaration.index = 60

  status = statusDeclaration(declarationWithOPMC)

  // 4. Must be "À renseigner" because datePublicationMesures is to be filled now.
  expect(status).toMatchInlineSnapshot(`"À renseigner"`)
})
