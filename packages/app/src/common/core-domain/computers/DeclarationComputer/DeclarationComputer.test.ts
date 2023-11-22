import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";

import { computeDeclarationIndex, DeclarationComputerInputBuilder } from "../DeclarationComputer";
import { dto1820 } from "./dto-1820";

it("DeclarationComputer: bug 1820 maternity leaves ", () => {
  const input = DeclarationComputerInputBuilder.fromDeclarationDTO(dto1820 as DeclarationDTO);

  const res = computeDeclarationIndex(input);

  expect(res).toMatchSnapshot();
});
