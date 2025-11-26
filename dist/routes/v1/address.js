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
const createAddress_1 = __importDefault(require("@/controller/v1/address/createAddress"));
const getAddresses_1 = __importDefault(require("@/controller/v1/address/getAddresses"));
const getAddressById_1 = __importDefault(require("@/controller/v1/address/getAddressById"));
const updateAddressById_1 = __importDefault(require("@/controller/v1/address/updateAddressById"));
const deleteAddressById_1 = __importDefault(require("@/controller/v1/address/deleteAddressById"));
const router = (0, express_1.Router)();
const createAddressValidation = [
    (0, express_validator_1.body)('client_id')
        .notEmpty().withMessage('client_id é obrigatório'),
    (0, express_validator_1.body)('provincia')
        .notEmpty().withMessage('Provincia é obrigatória')
        .isLength({ max: 10 }).withMessage('Provincia deve ter no máximo 10 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('municipio')
        .notEmpty().withMessage('Municipio é obrigatório')
        .isLength({ max: 50 }).withMessage('Municipio deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('bairro')
        .notEmpty().withMessage('Bairro é obrigatório')
        .isLength({ max: 50 }).withMessage('Bairro deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('rua_ou_avenida')
        .notEmpty().withMessage('Rua ou avenida é obrigatória')
        .isLength({ max: 50 }).withMessage('Rua ou avenida deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('numero_da_casa')
        .notEmpty().withMessage('Número da casa é obrigatório')
        .isLength({ max: 50 }).withMessage('Número da casa deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('ponto_de_referencia')
        .optional()
        .trim()
        .escape()
];
const updateAddressValidation = [
    (0, express_validator_1.param)('address_id')
        .notEmpty().withMessage('ID do endereço é obrigatório'),
    (0, express_validator_1.body)('provincia')
        .optional()
        .isLength({ max: 10 }).withMessage('Provincia deve ter no máximo 10 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('municipio')
        .optional()
        .isLength({ max: 50 }).withMessage('Municipio deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('bairro')
        .optional()
        .isLength({ max: 50 }).withMessage('Bairro deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('rua_ou_avenida')
        .optional()
        .isLength({ max: 50 }).withMessage('Rua ou avenida deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('numero_da_casa')
        .optional()
        .isLength({ max: 50 }).withMessage('Número da casa deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('ponto_de_referencia')
        .optional()
        .trim()
        .escape()
];
const addressIdValidation = [
    (0, express_validator_1.param)('address_id')
        .notEmpty().withMessage('ID do endereço é obrigatório')
];
const addressesPaginationValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit deve ser entre 1 e 100'),
    (0, express_validator_1.query)('client_id').optional().trim(),
    (0, express_validator_1.query)('provincia').optional().trim().escape(),
    (0, express_validator_1.query)('municipio').optional().trim().escape(),
    (0, express_validator_1.query)('bairro').optional().trim().escape(),
    (0, express_validator_1.query)('search').optional().trim().escape()
];
router.post('/register', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), createAddressValidation, validationError_1.default, createAddress_1.default);
router.get('/addresses', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), addressesPaginationValidation, validationError_1.default, getAddresses_1.default);
router.get('/:address_id', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), addressIdValidation, validationError_1.default, getAddressById_1.default);
router.put('/:address_id', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), updateAddressValidation, validationError_1.default, updateAddressById_1.default);
router.delete('/:address_id', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), addressIdValidation, validationError_1.default, deleteAddressById_1.default);
exports.default = router;
