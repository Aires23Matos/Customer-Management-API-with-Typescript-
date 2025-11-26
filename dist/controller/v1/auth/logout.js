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
const winston_1 = require("../../../lib/winston");
const tokens_1 = __importDefault(require("../../../models/tokens"));
const config_1 = __importDefault(require("../../../config"));
const Logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.RefreshToken;
        if (refreshToken) {
            yield tokens_1.default.deleteOne({ token: refreshToken });
            winston_1.logger.info('Token de atualização do usuário excluído com êxito', {
                userId: req.userId,
                token: refreshToken
            });
        }
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: config_1.default.node_env === 'Production',
            sameSite: 'strict'
        });
        res.sendStatus(204);
        winston_1.logger.info('Efetue logout do usuário com êxito', {
            userId: req.userId
        });
    }
    catch (err) {
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: err
        });
        winston_1.logger.error('Erro durante o sair do utilizador');
    }
});
exports.default = Logout;
