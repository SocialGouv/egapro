import { render } from "@testing-library/react";

import { Brand } from "../Brand";

describe("<Brand />", () => {
  it("uses the current ministry name", () => {
    const { container } = render(<Brand />);

    expect(container).toHaveTextContent("Ministère du Travail et des Solidarités");
  });
});
