"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
exports.jwtConstants = {
    secret: 'secretKey',
    publicKey: fs_1.readFileSync('../keys.pub'),
    privateKey: fs_1.readFileSync('../keys')
};
//# sourceMappingURL=constants.js.map