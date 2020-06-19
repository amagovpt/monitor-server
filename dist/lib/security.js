"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMd5Hash = exports.createRandomUniqueHash = exports.comparePasswordHash = exports.generatePasswordHash = void 0;
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