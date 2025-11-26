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
const jwt_1 = require("src/lib/jwt");
const winston_1 = require("src/lib/winston");
const config_1 = __importDefault(require("src/config"));
const tokens_1 = __importDefault(require("src/models/tokens"));
const user_1 = __importDefault(require("src/models/user"));
const Login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield user_1.default.findOne({ email })
            .select('username email password role')
            .lean()
            .exec();
        if (!user) {
            res.status(404).json({
                code: 'NotFound',
                message: 'Usuário não encontrado'
            });
            return;
        }
        const accessToken = (0, jwt_1.generateAccessToken)(user._id);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user._id);
        yield tokens_1.default.create({ token: refreshToken, userId: user._id });
        winston_1.logger.info('Atualizar token criado para o usuário', {
            userId: user._id,
            token: refreshToken
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config_1.default.node_env === 'production',
            sameSite: 'strict'
        });
        res.status(201).json({
            user: {
                username: user.username,
                email: user.email,
                role: user.role
            },
            accessToken
        });
        winston_1.logger.info('Usuário iniciou a cessao com sucesso', user);
    }
    catch (err) {
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: err
        });
        winston_1.logger.error('Erro durante o registo do utilizador');
    }
});
exports.default = Login;
