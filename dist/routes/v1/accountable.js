"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authentication_1 = __importDefault(require("@/middlewares/authentication"));
const validationError_1 = __importDefault(require("@/middlewares/validationError"));
const authorize_1 = __importDefault(require("@/middlewares/authorize"));
const createAccountable_1 = __importDefault(require("@/controller/v1/accountable/createAccountable"));
const getAccountables_1 = __importDefault(require("@/controller/v1/accountable/getAccountables"));
const getAccountableById_1 = __importDefault(require("@/controller/v1/accountable/getAccountableById"));
const updateAccountableById_1 = __importDefault(require("@/controller/v1/accountable/updateAccountableById"));
const deleteAccountableById_1 = __importDefault(require("@/controller/v1/accountable/deleteAccountableById"));
const router = (0, express_1.Router)();
const createAccountableValidation = [
    (0, express_validator_1.body)('client_id')
        .notEmpty().withMessage('client_id é obrigatório'),
    (0, express_validator_1.body)('nome')
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ max: 50 }).withMessage('Nome deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('email')
        .notEmpty().withMessage('Email é obrigatório')
        .isEmail().withMessage('Formato de email inválido')
        .normalizeEmail(),
    (0, express_validator_1.body)('telefone')
        .notEmpty().withMessage('Telefone é obrigatório')
        .matches(/^\d{9,13}$/).withMessage('Telefone deve ter 9-13 dígitos')
        .trim()
        .escape(),
    (0, express_validator_1.body)('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano')
];
const updateAccountableValidation = [
    (0, express_validator_1.param)('accountable_id')
        .notEmpty().withMessage('ID do responsável é obrigatório'),
    (0, express_validator_1.body)('nome')
        .optional()
        .isLength({ max: 50 }).withMessage('Nome deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail().withMessage('Formato de email inválido')
        .normalizeEmail(),
    (0, express_validator_1.body)('telefone')
        .optional()
        .matches(/^\d{9,13}$/).withMessage('Telefone deve ter 9-13 dígitos')
        .trim()
        .escape(),
    (0, express_validator_1.body)('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano')
];
const accountableIdValidation = [
    (0, express_validator_1.param)('accountable_id')
        .notEmpty().withMessage('ID do responsável é obrigatório')
];
const accountablesPaginationValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit deve ser entre 1 e 100'),
    (0, express_validator_1.query)('client_id').optional().trim(),
    (0, express_validator_1.query)('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano'),
    (0, express_validator_1.query)('search').optional().trim().escape()
];
router.post('/register', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), createAccountableValidation, validationError_1.default, createAccountable_1.default);
router.get('/accountables', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), accountablesPaginationValidation, validationError_1.default, getAccountables_1.default);
router.get('/:accountable_id', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), accountableIdValidation, validationError_1.default, getAccountableById_1.default);
router.put('/:accountable_id', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), updateAccountableValidation, validationError_1.default, updateAccountableById_1.default);
router.delete('/:accountable_id', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), accountableIdValidation, validationError_1.default, deleteAccountableById_1.default);
exports.default = router;
