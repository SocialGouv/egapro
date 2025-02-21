import { fireEvent, render } from "@testing-library/react";
import { wait } from "@testing-library/user-event/dist/utils";

import EffectifsPage from "../page";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({})),
}));

describe("<EffectifsForm />", () => {
  it("should wait for valid form to allow next step", async () => {
    const { getByLabelText, getByRole } = render(<EffectifsPage />);
    fireEvent.click(getByLabelText("De 50 à 250 inclus"));
    expect(getByRole("button", { name: "Suivant" })).toHaveAttribute("disabled");
    fireEvent.change(getByLabelText("ouv, :29, femmes"), { target: { value: 1 } });
    await wait();
    expect(getByRole("button", { name: "Suivant" })).not.toHaveAttribute("disabled");
  });
});
