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
const express_validator_1 = require("express-validator");
const authentication_1 = __importDefault(require("../../middlewares/authentication"));
const validationError_1 = __importDefault(require("../../middlewares/validationError"));
const authorize_1 = __importDefault(require("../../middlewares/authorize"));
const user_1 = __importDefault(require("../../models/user"));
const get_current_user_1 = __importDefault(require("../../controller/v1/user/get_current_user"));
const update_current_user_1 = __importDefault(require("../../controller/v1/user/update_current_user"));
const delete_current_user_1 = __importDefault(require("../../controller/v1/user/delete_current_user"));
const get_all_users_1 = __importDefault(require("../../controller/v1/user/get_all_users"));
const get_user_1 = __importDefault(require("../../controller/v1/user/get_user"));
const delete_user_1 = __importDefault(require("../../controller/v1/user/delete_user"));
const upadete_user_1 = __importDefault(require("../../controller/v1/user/upadete_user"));
const router = (0, express_1.Router)();
router.get('/current', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), get_current_user_1.default);
router.delete('/delete/current', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), delete_current_user_1.default);
router.get('/', authentication_1.default, (0, express_validator_1.query)('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('O limite deve ser entre 1 a 50'), (0, express_validator_1.query)('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('O deslocamento deve ser um número inteiro positivo'), validationError_1.default, (0, authorize_1.default)(['admin']), get_all_users_1.default);
router.get('/:userId', authentication_1.default, (0, authorize_1.default)(['admin']), (0, express_validator_1.param)('userId').notEmpty().isMongoId().withMessage('Invalid user ID'), validationError_1.default, get_user_1.default);
router.patch('updateuser/:id', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), (0, express_validator_1.body)('username')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('O nome de usuário deve ter menos de 20 caracteres')
    .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
    const userExist = yield user_1.default.exists({ username: value });
    if (userExist) {
        throw Error('Este nome de utilizador já está a ser utilizado');
    }
})), (0, express_validator_1.body)('email')
    .optional()
    .isLength({ max: 50 })
    .withMessage('O e-mail deve ter menos de 50 caracteres')
    .isEmail()
    .withMessage('Endereço de e-mail inválido')
    .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
    const useExist = yield user_1.default.exists({ email: value });
    if (useExist) {
        throw Error('Este e-mail já está em uso');
    }
})), (0, express_validator_1.body)('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('A palavra-passe tem de ter, pelo menos, 8 caractere'), (0, express_validator_1.body)('first_name')
    .optional()
    .isLength({ max: 20 })
    .withMessage('O nome próprio deve ter menos de 20 caracteres'), (0, express_validator_1.body)('last_name')
    .optional()
    .isLength({ max: 20 })
    .withMessage('O sobrenome deve ter menos de 20 caracteres'), validationError_1.default, upadete_user_1.default);
router.put('/update/:current_id', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), (0, express_validator_1.body)('username')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('O nome de usuário deve ter menos de 20 caracteres')
    .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
    const userExist = yield user_1.default.exists({ username: value });
    if (userExist) {
        throw Error('Este nome de utilizador já está a ser utilizado');
    }
})), (0, express_validator_1.body)('email')
    .optional()
    .isLength({ max: 50 })
    .withMessage('O e-mail deve ter menos de 50 caracteres')
    .isEmail()
    .withMessage('Endereço de e-mail inválido')
    .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
    const useExist = yield user_1.default.exists({ email: value });
    if (useExist) {
        throw Error('Este e-mail já está em uso');
    }
})), (0, express_validator_1.body)('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('A palavra-passe tem de ter, pelo menos, 8 caractere'), (0, express_validator_1.body)('first_name')
    .optional()
    .isLength({ max: 20 })
    .withMessage('O nome próprio deve ter menos de 20 caracteres'), (0, express_validator_1.body)('last_name')
    .optional()
    .isLength({ max: 20 })
    .withMessage('O sobrenome deve ter menos de 20 caracteres'), validationError_1.default, update_current_user_1.default);
router.delete('/delete/:userId', authentication_1.default, (0, authorize_1.default)(['admin']), (0, express_validator_1.param)('userId').notEmpty().isMongoId().withMessage('Invalid user ID'), validationError_1.default, delete_user_1.default);
exports.default = router;
