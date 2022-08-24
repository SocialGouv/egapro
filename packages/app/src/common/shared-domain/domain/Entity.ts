export type UUID = string;
export abstract class Entity<P, Id = UUID> {
  constructor(protected readonly props: P, public readonly id?: Id) {}
}
