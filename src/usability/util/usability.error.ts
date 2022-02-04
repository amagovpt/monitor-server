export class UsabilityError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, UsabilityError.prototype)
    }
}
