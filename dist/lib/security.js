"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = __importStar(require("bcrypt"));
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
function generateMd5Hash(content) {
    return crypto_1.createHash('md5').update(content).digest('hex');
}
exports.generateMd5Hash = generateMd5Hash;
//# sourceMappingURL=security.js.map