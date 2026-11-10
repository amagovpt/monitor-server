import { SetMetadata } from '@nestjs/common';

export const DESTRUCTION_CHALLENGE_KEY = 'destruction_challenge';
export const RequireDestructionChallenge = () => SetMetadata(DESTRUCTION_CHALLENGE_KEY, true);
