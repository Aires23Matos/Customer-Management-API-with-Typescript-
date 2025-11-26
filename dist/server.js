"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("./config"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("./lib/express_rate_limit"));
const index_1 = __importDefault(require("./routes/v1/index"));
const mongoose_1 = require("./database/mongoose");
const winston_1 = require("./lib/winston");
const app = (0, express_1.default)();
const PORT = config_1.default;
const corsOption = {
    origin(origin, callback) {
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev || !origin || PORT.whitelist_origins.includes(origin)) {
            callback(null, true);
        }
        else {
            winston_1.logger.warn(`🚫 CORS bloqueado: ${origin} não é permitido pelos cors`);
            callback(new Error(`CORS error: ${origin} não é permitido pelos cors`), false);
        }
    },
};
app.use((0, cors_1.default)(corsOption));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)({
    threshold: 1024,
}));
app.use((0, helmet_1.default)());
app.use(express_rate_limit_1.default);
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, mongoose_1.connectToDatabase)();
        app.use('/api/v1', index_1.default);
        app.listen(PORT, () => {
            winston_1.logger.info(`erverS Runing http://localhost:${PORT}`);
        });
    }
    catch (err) {
        winston_1.logger.error('Falha ao iniciar o servidor', err);
        if (PORT.node_env === 'production') {
            process.exit(1);
        }
    }
}))();
const handleServerShutdown = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mongoose_1.disconnectFromDatabase)();
    try {
        winston_1.logger.warn('Server SHUTDOWN');
        process.exit(0);
    }
    catch (err) {
        winston_1.logger.error('Error during server shutdown', err);
    }
});
process.on('SIGTERM', handleServerShutdown);
process.on('SIGINT', handleServerShutdown);
