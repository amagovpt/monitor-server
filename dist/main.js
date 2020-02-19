"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    app.use(helmet());
    app.use(compression());
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
    }));
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map