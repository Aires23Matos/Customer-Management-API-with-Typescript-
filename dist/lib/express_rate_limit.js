"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_rate_limit_1 = require("express-rate-limit");
const Limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: 'Você enviou para muitos pedidos em um determinado período de tempo, tente novamente mais tarde.'
    }
});
exports.default = Limiter;
