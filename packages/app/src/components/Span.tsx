export type SpanProps = {
  name: string;
};

export const Span = ({ name }: SpanProps) => {
  return <span>Hello {name}</span>;
};
