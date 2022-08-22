import { Any } from '../../utils/types';
import type { Entity } from "../domain";

export interface Mapper<E extends Entity<Any, Any>, D, P = Any> {
    toDTO(obj: E): D;
    toDomain(raw: P): E;
    toPersistence?(obj: E): P;
}

export const convertArray = <T>(a?: T[]) => (a ? [...a] : []);
