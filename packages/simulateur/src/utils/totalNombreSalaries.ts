function totalNombreSalaries(
  nombreSalaries: Array<{
    tranchesAges: Array<{
      nombreSalariesHommes?: number
      nombreSalariesFemmes?: number
    }>
  }>,
) {
  return nombreSalaries.reduce(
    (acc, { tranchesAges }) => {
      const { totalGroupNombreSalariesHomme, totalGroupNombreSalariesFemme } = tranchesAges.reduce(
        (accGroup, { nombreSalariesHommes, nombreSalariesFemmes }) => {
          return {
            totalGroupNombreSalariesHomme: accGroup.totalGroupNombreSalariesHomme + (nombreSalariesHommes || 0),
            totalGroupNombreSalariesFemme: accGroup.totalGroupNombreSalariesFemme + (nombreSalariesFemmes || 0),
          }
        },
        { totalGroupNombreSalariesHomme: 0, totalGroupNombreSalariesFemme: 0 },
      )

      return {
        totalNombreSalariesHomme: acc.totalNombreSalariesHomme + totalGroupNombreSalariesHomme,
        totalNombreSalariesFemme: acc.totalNombreSalariesFemme + totalGroupNombreSalariesFemme,
      }
    },
    { totalNombreSalariesHomme: 0, totalNombreSalariesFemme: 0 },
  )
}

export default totalNombreSalaries
