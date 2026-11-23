import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { EnquireRelationType, FgaTupleEnquire, ResourceType } from '../types/fga.types';

export interface FgtaTupleCheck<T extends ResourceType, E extends keyof EnquireRelationType> {
  objectType: T;
  action: FgaTupleEnquire<E>['relation'];
  resourceIdResolver?: (ctx: ExecutionContext) => string | undefined;
}

/** A tuple check. */
export type AnyFgaTupleCheck = FgtaTupleCheck<ResourceType, keyof EnquireRelationType>;

/** A tuple check or a non-empty list checked with OR semantics. */
export type FgaTupleChecks<
  T extends ResourceType = ResourceType,
  E extends keyof EnquireRelationType = keyof EnquireRelationType,
> = FgtaTupleCheck<T, E> | readonly [AnyFgaTupleCheck, ...AnyFgaTupleCheck[]];

export const FGA_DECORATOR_KEY = 'fga_authorization';

/** Registers the FGA policy and rejects empty tuple lists. */
export function FgaAuthorized<T extends ResourceType, E extends keyof EnquireRelationType>(
  data: FgtaTupleCheck<T, E>,
): MethodDecorator & ClassDecorator;
export function FgaAuthorized(
  data: readonly [AnyFgaTupleCheck, ...AnyFgaTupleCheck[]],
): MethodDecorator & ClassDecorator;
export function FgaAuthorized(data: FgaTupleChecks): MethodDecorator & ClassDecorator;
export function FgaAuthorized(
  data: AnyFgaTupleCheck | readonly AnyFgaTupleCheck[],
): MethodDecorator & ClassDecorator {
  const checks = Array.isArray(data) ? [...data] : [data];
  if (checks.length === 0) {
    throw new Error('@FgaAuthorized() requires at least one tuple.');
  }
  return SetMetadata(FGA_DECORATOR_KEY, checks);
}
