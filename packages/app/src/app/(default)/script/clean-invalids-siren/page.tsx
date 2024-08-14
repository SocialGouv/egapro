import { getAllDeclarations } from "../actions";

function validateSIREN(siren: string): boolean {
  // Vérifie que la chaîne est composée de 9 chiffres
  if (!/^\d{9}$/.test(siren)) {
    return false;
  }

  // Applique l'algorithme de Luhn
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let num = parseInt(siren.charAt(i), 10);

    // Multiplie les chiffres en position paire par 2
    if (i % 2 === 1) {
      num *= 2;
      // Si le résultat est supérieur à 9, soustrait 9
      if (num > 9) {
        num -= 9;
      }
    }

    sum += num;
  }

  // Le numéro est valide si la somme est un multiple de 10
  return sum % 10 === 0;
}

const CleanInvalidsSirenPage = async () => {
  try {
    const declarations = await getAllDeclarations();
    const invalidDeclarations = [];
    for (const declaration of declarations) {
      if (!declaration.data?.entreprise.siren) {
        //console.log("No siren", declaration.siren);
      }
      if (!validateSIREN(declaration.data?.entreprise.siren || "")) {
        console.log("Invalid siren", declaration.siren);
        invalidDeclarations.push({ ...declaration, invalidSiren: declaration.siren });
        break;
      }
      if (!declaration.data?.entreprise.ues?.entreprises) {
        //console.log("No ues", declaration.siren);
      }
      for (const entreprise of declaration.data?.entreprise.ues?.entreprises || []) {
        if (!validateSIREN(entreprise.siren)) {
          invalidDeclarations.push({ ...declaration, invalidSiren: entreprise.siren });
          console.log("Invalid ues siren", entreprise.siren);
          break;
        }
      }
    }
    // const invalids = declarations
    //   .filter(declaration => new Siren(declaration.data?.entreprise.siren || ""))
    //   .filter(declaration => {
    //     if (!declaration.data?.entreprise.ues?.entreprises) {
    //       return true;
    //     }
    //
    //     return declaration.data?.entreprise.ues?.entreprises.reduce((hasValidSirens, entreprise) => {
    //       if (!hasValidSirens) return false;
    //       try {
    //         new Siren(entreprise.siren);
    //         return true;
    //       } catch (e) {
    //         console.log("Invalid siren", entreprise.siren, e);
    //         return false;
    //       }
    //     }, true);
    //   });

    return (
      <div>
        <p>nombre de sirens invalides: {invalidDeclarations.length}</p>
        <ul>
          {invalidDeclarations.map(declaration => (
            <li>
              declaration siren:{declaration.siren}, declaration année: {declaration.year} invalid ues siren:{" "}
              {declaration.invalidSiren}
            </li>
          ))}
        </ul>
      </div>
    );
  } catch (e) {
    console.log(e);
    return <p>Error</p>;
  }
};

export default CleanInvalidsSirenPage;
