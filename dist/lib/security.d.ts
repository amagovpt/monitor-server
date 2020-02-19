export declare function generatePasswordHash(password: string): Promise<string>;
export declare function comparePasswordHash(password: string, passwordHash: string): Promise<boolean>;
export declare function createRandomUniqueHash(): string;
