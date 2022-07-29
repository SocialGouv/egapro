import {
  buildDeclarationFromSimulation,
  DeclarationAPI,
  Indicateur1Calculable,
  updateDeclarationWithObjectifsMesures,
} from "../utils/declarationBuilder"
import { ObjectifsMesuresFormSchema } from "../views/private/ObjectifsMesuresPage"
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

const objectifsMesuresData: ObjectifsMesuresFormSchema = {
  objectifIndicateurQuatre: "12",
  objectifIndicateurDeuxTrois: "16",
  datePublicationMesures: "2022-06-30",
  datePublicationObjectifs: "2022-06-29",
  modalitesPublicationObjectifsMesures: "voici les modalités amendées",
}

describe("A declaration issued from simulation must preserved or removed objectifs and mesures following context", () => {
  test("With a declaration of index 65 : update objectifs and mesures, update declaration => objectifs and mesures must be preserved", () => {
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

    expect(declarationAPI.data.déclaration.index).toMatchInlineSnapshot(`65`)
    expect(declarationAPI.data.entreprise.effectif.tranche).toMatchInlineSnapshot(`"50:250"`)

    // 2. Update declaration with objectifs and mesures
    const declarationWithOPMC = updateDeclarationWithObjectifsMesures(declarationAPI, objectifsMesuresData)

    // 3. Reupdate declaration
    const declarationUpdated = buildDeclarationFromSimulation({
      id: "e1b52342-0e60-11ed-a33f-0242c0a82004",
      state: simulationWithIndex65.data,
      declarationBase: declarationWithOPMC,
    })

    // 4. Check that objectifs and mesures are preserved
    expect(declarationUpdated).toEqual(declarationWithOPMC.data)
  })

  test("With a declaration of index 65 : update objectifs and mesures, update declaration with another tranche => objectifs and mesures must be removed", () => {
    // 1. Build declaration from simulation.
    const initialDeclaration = buildDeclarationFromSimulation({
      id: "e1b52342-0e60-11ed-a33f-0242c0a82004",
      state: simulationWithIndex65.data,
    })

    const declarationAPI: DeclarationAPI = {
      siren: "825397516",
      year: 2021,
      data: initialDeclaration,
      modified_at: 1656517469,
      declared_at: 1656407985,
    }

    // 2. Check index and tranche.

    expect(declarationAPI.data.déclaration.index).toMatchInlineSnapshot(`65`)
    expect(declarationAPI.data.entreprise.effectif.tranche).toMatchInlineSnapshot(`"50:250"`)

    // 2. Update declaration with objectifs and mesures.
    const declarationWithOPMC = updateDeclarationWithObjectifsMesures(declarationAPI, objectifsMesuresData)

    // Create a block to limit the scope of the variables.
    {
      const {
        augmentations,
        promotions,
        augmentations_et_promotions,
        congés_maternité,
        hautes_rémunérations,
        rémunérations,
      } = declarationWithOPMC.data.indicateurs || {}

      // 3. Check indicateurs.

      expect((rémunérations as Indicateur1Calculable)?.note).toBe(40)
      expect(augmentations).toBeUndefined()
      expect(promotions).toBeUndefined()
      expect(augmentations_et_promotions).toEqual({
        note: 15,
        note_en_pourcentage: 0,
        note_nombre_salariés: 15,
        objectif_de_progression: "16",
        population_favorable: "femmes",
        résultat: 33.3333,
        résultat_nombre_salariés: 6,
      })
      expect(congés_maternité).toEqual({
        note: 0,
        objectif_de_progression: "12",
        résultat: 25,
      })
      expect(hautes_rémunérations).toEqual({
        note: 10,
        population_favorable: "hommes",
        résultat: 4,
      })
    }

    // 4. Modify the tranche.
    const cloneSimulation = { ...simulationWithIndex65 }
    cloneSimulation.data.informations.trancheEffectifs = "1000 et plus" // for entreprise with tranche > 250, indicateur2&3 is replaced by indicateur2 and indicateur3

    // 5. Resend declaration.
    const declarationUpdated = buildDeclarationFromSimulation({
      id: "e1b52342-0e60-11ed-a33f-0242c0a82004",
      state: cloneSimulation.data,
      declarationBase: declarationWithOPMC,
    })

    {
      const {
        augmentations,
        promotions,
        augmentations_et_promotions,
        congés_maternité,
        hautes_rémunérations,
        rémunérations,
      } = declarationUpdated.indicateurs || {}

      // 6. Check index and tranche.
      expect(declarationUpdated.déclaration.index).toMatchInlineSnapshot(`65`)
      expect(declarationUpdated.entreprise.effectif.tranche).toMatchInlineSnapshot(`"1000:"`)

      // 7. Check that indicateurs are well set.
      expect((rémunérations as Indicateur1Calculable)?.note).toBe(40) // hasn't changed

      // new indicateur
      expect(augmentations).toEqual({
        catégories: [undefined, undefined, undefined, undefined],
        note: undefined,
        résultat: undefined,
      })

      // new indicateur
      expect(promotions).toEqual({
        catégories: [undefined, undefined, undefined, undefined],
        note: undefined,
        résultat: undefined,
      })

      expect(augmentations_et_promotions).toBeUndefined() // indicateur has been removed

      // hasn't changed
      expect(congés_maternité).toEqual({
        note: 0,
        objectif_de_progression: "12",
        résultat: 25,
      })

      // hasn't changed
      expect(hautes_rémunérations).toEqual({
        note: 10,
        population_favorable: "hommes",
        résultat: 4,
      })
    }
  })
})
