"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
async function generatePasswordHash(password) {
    return bcrypt.hash(password.trim(), 10);
}
exports.generatePasswordHash = generatePasswordHash;
async function comparePasswordHash(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
}
exports.comparePasswordHash = comparePasswordHash;
function createRandomUniqueHash() {
    const current_date = (new Date()).valueOf().toString();
    const random = Math.random().toString();
    return crypto_1.createHash('sha256').update(current_date + random).digest('hex');
}
exports.createRandomUniqueHash = createRandomUniqueHash;
//# sourceMappingURL=security.js.map