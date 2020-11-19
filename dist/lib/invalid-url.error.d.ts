export declare class InvalidUrl extends Error {
    private readonly url;
    constructor(url: string, message?: string);
    getUrl(): string;
}
