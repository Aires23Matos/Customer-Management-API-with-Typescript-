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
const config_1 = __importDefault(require("../../../config"));
const user_1 = __importDefault(require("../../../models/user"));
const tokens_1 = __importDefault(require("../../../models/tokens"));
const utils_1 = require("../../../utils");
const jwt_1 = require("../../../lib/jwt");
const Register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, role, firstName, lastName, adminCode } = req.body;
    console.log('Dados recebidos:', { email, password, role, firstName, lastName, adminCode });
    if (role === 'admin') {
        if (!adminCode) {
            res.status(400).json({
                code: 'AdminCodeRequired',
                message: 'Código de administrador é obrigatório'
            });
            return;
        }
        if (adminCode !== config_1.default.admin_registration_code) {
            res.status(403).json({
                code: 'InvalidAdminCode',
                message: 'Código de administrador inválido'
            });
            winston_1.logger.warn(`Tentativa de registo como administrador com código inválido: ${adminCode}`);
            return;
        }
    }
    try {
        const username = (0, utils_1.genUsername)();
        console.log('Tentando criar usuário com:', {
            username, email, role, firstName, lastName
        });
        const newUser = yield user_1.default.create(Object.assign(Object.assign({ username,
            email,
            password,
            role }, (firstName && { firstName })), (lastName && { lastName })));
        console.log('Usuário criado com sucesso:', newUser);
        const accessToken = (0, jwt_1.generateAccessToken)(newUser._id);
        const refreshToken = (0, jwt_1.generateRefreshToken)(newUser._id);
        yield tokens_1.default.create({ token: refreshToken, userId: newUser._id });
        winston_1.logger.info('Atualizar token criado para o usuário', {
            userId: newUser._id,
            token: refreshToken
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config_1.default.node_env === 'production',
            sameSite: 'strict'
        });
        res.status(201).json({
            user: {
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                firstName: newUser.firstName,
                lastName: newUser.lastName
            },
            accessToken
        });
        winston_1.logger.info('Usuário registrado com sucesso', {
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            firstName: newUser.firstName,
            lastName: newUser.lastName
        });
    }
    catch (err) {
        console.error('Erro detalhado no registo:', err);
        winston_1.logger.error('Erro durante o registo do utilizador', {
            error: err.message,
            stack: err.stack,
            name: err.name
        });
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map((error) => error.message);
            res.status(400).json({
                code: 'ValidationError',
                message: 'Erro de validação',
                errors: errors
            });
            return;
        }
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            res.status(409).json({
                code: 'DuplicateField',
                message: `${field} já está em uso`
            });
            return;
        }
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});
exports.default = Register;
