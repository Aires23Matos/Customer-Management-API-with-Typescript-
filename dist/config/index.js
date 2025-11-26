"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const Config = {
    port: process.env.PORT || 3000,
    node_env: process.env.NODE_ENV,
    whitelist_origins: ['https://docs.blog-api.codeeithsadee.com'],
    mongo_url: process.env.MONGO_URL,
    log_level: process.env.LOG_LEVER || 'info',
    jwt_access_secret: process.env.JWT_ACCESS_SECRET || '52257f3c19e8f6eb3745a2d9c1de6611',
    jwt_access_refresh: process.env.JWT_REFRESH_SECRET || '52257f3c19e8f6eb3745a2d9c1de6611',
    access_token_expiry: process.env.ACCESS_TOKEN_EXPIRY,
    refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRY,
    whitelist_admins_mail: process.env.SECRET_EMAIL || 'testeemezema@gmail.com',
    admin_registration_code: process.env.ADMIN_REGISTRATION_CODE || 'ADMIN12345',
    defaultResLimit: 20,
    defaultResOffset: 0
};
exports.default = Config;
