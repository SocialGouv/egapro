type SpanProps = {
  name: string
}

export function Span({ name }: SpanProps) {
  return <span>Hello {name}</span>
}
