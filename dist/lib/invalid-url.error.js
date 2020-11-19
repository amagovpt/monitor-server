"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidUrl = void 0;
class InvalidUrl extends Error {
    constructor(url, message) {
        super(message);
        this.url = url;
    }
    getUrl() {
        return this.url;
    }
}
exports.InvalidUrl = InvalidUrl;
//# sourceMappingURL=invalid-url.error.js.map