import { render, screen } from "@testing-library/react"
import { Span } from "@/components/Span"

test("should display Span component", () => {
  render(<Span name="world" />)

  expect(screen.getByText("Hello world")).toBeInTheDocument()
})

test("should match snapshot", () => {
  const view = render(<Span name="world" />)
  expect(view).toMatchSnapshot()
})
