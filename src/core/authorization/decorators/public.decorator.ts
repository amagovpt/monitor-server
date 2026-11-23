import { SetMetadata, applyDecorators } from '@nestjs/common';

export const PUBLIC_ROUTE_KEY = 'access_policy:public';

export interface PublicOptions {
  /** Required explanation for allowing unauthenticated access. */
  reason: string;
}

/** Marks a route or controller as public. */
export function Public(options: PublicOptions): MethodDecorator & ClassDecorator {
  if (!options?.reason || options.reason.trim().length < 10) {
    throw new Error('@Public() requires a meaningful "reason" (min. 10 characters).');
  }
  return applyDecorators(SetMetadata(PUBLIC_ROUTE_KEY, options));
}
