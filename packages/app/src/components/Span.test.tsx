import { render, screen } from "@testing-library/react"
import { Span } from "./Span"

test("should display Span component", () => {
  render(<Span name="world" />)

  expect(screen.getByText("Hello world")).toBeInTheDocument()
})
