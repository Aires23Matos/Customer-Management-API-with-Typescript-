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
const express_1 = require("express");
const register_1 = __importDefault(require("../../controller/v1/auth/register"));
const login_1 = __importDefault(require("../../controller/v1/auth/login"));
const express_validator_1 = require("express-validator");
const validationError_1 = __importDefault(require("../../middlewares/validationError"));
const user_1 = __importDefault(require("../../models/user"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const refresh_token_1 = __importDefault(require("../../controller/v1/auth/refresh_token"));
const logout_1 = __importDefault(require("../../controller/v1/auth/logout"));
const authentication_1 = __importDefault(require("../../middlewares/authentication"));
const create_client_1 = __importDefault(require("@/controller/v1/client/create_client"));
const router = (0, express_1.Router)();
router.post('/register', (0, express_validator_1.body)('email')
    .trim()
    .notEmpty()
    .withMessage('O e-mail é obrigatório')
    .isLength({ max: 50 })
    .withMessage('O e-mail deve ter menos de 50 caracteres')
    .isEmail()
    .withMessage('Endereço de e-mail inválido')
    .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
    const userExist = yield user_1.default.exists({ email: value });
    if (userExist) {
        throw new Error('Usuário já existe');
    }
})), (0, express_validator_1.body)('password')
    .optional()
    .isLength({ min: 4 })
    .withMessage('A palavra-passe tem de ter, pelo menos, 4 caracteres')
    .isString()
    .withMessage('A função deve ser uma cadeia de caracteres')
    .isIn(['admin', 'user'])
    .withMessage('A função deve ser de administrador ou usuário'), register_1.default);
router.post('/login', (0, express_validator_1.body)('email')
    .trim()
    .notEmpty()
    .withMessage('O e-mail é obrigatório')
    .isLength({ max: 50 })
    .withMessage('O e-mail deve ter menos de 50 caracteres')
    .isEmail()
    .withMessage('Endereço de e-mail inválido')
    .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
    const userExist = yield user_1.default.exists({ email: value });
    if (!userExist) {
        throw new Error('O e-mail ou a palavra-passe do utilizador são inválidos');
    }
})), (0, express_validator_1.body)('password')
    .notEmpty()
    .withMessage('A palavra-passe é necessária')
    .isLength({ min: 4 })
    .withMessage('A palavra-passe tem de ter, pelo menos, 4 caracteres')
    .custom((value_1, _a) => __awaiter(void 0, [value_1, _a], void 0, function* (value, { req }) {
    const { email } = req.body;
    const user = yield user_1.default.findOne({ email })
        .select('password')
        .lean()
        .exec();
    if (!user) {
        throw new Error('O e-mail ou a palavra-passe do utilizador são inválidos');
    }
    const passwordMatch = yield bcrypt_1.default.compare(value, user.password);
    if (!passwordMatch) {
        throw new Error('O e-mail ou a palavra-passe do utilizador são inválidos');
    }
})), validationError_1.default, login_1.default);
router.post('/refresh-token', (0, express_validator_1.cookie)('refreshToken')
    .notEmpty()
    .withMessage('Atualizar token necessário')
    .isJWT()
    .withMessage('Token de atualização inválido'), refresh_token_1.default);
router.post('/logout', authentication_1.default, logout_1.default);
router.post("/register/client", (0, express_validator_1.body)('clientName')
    .notEmpty().withMessage('Nome do cliente é obrigatório')
    .isLength({ max: 20 }).withMessage('Nome deve ter no máximo 20 caracteres')
    .trim()
    .escape(), (0, express_validator_1.body)('nif')
    .isNumeric().withMessage('NIF deve conter apenas números')
    .isLength({ min: 9, max: 9 }).withMessage('NIF deve ter exatamente 9 dígitos'), authentication_1.default, create_client_1.default);
exports.default = router;
