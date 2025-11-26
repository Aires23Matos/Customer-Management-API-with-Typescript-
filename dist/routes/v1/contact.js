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
const createContact_1 = __importDefault(require("@/controller/v1/contact/createContact"));
const getContacts_1 = __importDefault(require("@/controller/v1/contact/getContacts"));
const getContactById_1 = __importDefault(require("@/controller/v1/contact/getContactById"));
const updateContactById_1 = __importDefault(require("@/controller/v1/contact/updateContactById"));
const deleteContactById_1 = __importDefault(require("@/controller/v1/contact/deleteContactById"));
const router = (0, express_1.Router)();
const createContactValidation = [
    (0, express_validator_1.body)('client_id')
        .notEmpty().withMessage('client_id é obrigatório')
        .isMongoId().withMessage('client_id deve ser um ID válido'),
    (0, express_validator_1.body)('web_site')
        .optional()
        .isURL().withMessage('Website deve ser uma URL válida')
        .trim(),
    (0, express_validator_1.body)('email')
        .notEmpty().withMessage('Email é obrigatório')
        .isEmail().withMessage('Email deve ter um formato válido')
        .normalizeEmail()
        .trim(),
    (0, express_validator_1.body)('telefone')
        .notEmpty().withMessage('Telefone é obrigatório')
        .isLength({ min: 9, max: 13 }).withMessage('Telefone deve ter entre 9 e 13 dígitos')
        .matches(/^[\d\s\(\)\-\.\+]+$/).withMessage('Telefone deve conter apenas números e caracteres de formatação')
        .trim(),
    (0, express_validator_1.body)('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano')
];
const updateContactValidation = [
    (0, express_validator_1.param)('contact_id')
        .notEmpty().withMessage('ID do contacto é obrigatório')
        .isMongoId().withMessage('ID do contacto deve ser um ID válido'),
    (0, express_validator_1.body)('web_site')
        .optional()
        .isURL().withMessage('Website deve ser uma URL válida')
        .trim(),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail().withMessage('Email deve ter um formato válido')
        .normalizeEmail()
        .trim(),
    (0, express_validator_1.body)('telefone')
        .optional()
        .isLength({ min: 9, max: 13 }).withMessage('Telefone deve ter entre 9 e 13 dígitos')
        .matches(/^[\d\s\(\)\-\.\+]+$/).withMessage('Telefone deve conter apenas números e caracteres de formatação')
        .trim(),
    (0, express_validator_1.body)('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano')
];
const contactIdValidation = [
    (0, express_validator_1.param)('contact_id')
        .notEmpty().withMessage('ID do contacto é obrigatório')
        .isMongoId().withMessage('ID do contacto deve ser um ID válido')
];
const contactsPaginationValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo')
        .toInt(),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit deve ser entre 1 e 100')
        .toInt(),
    (0, express_validator_1.query)('client_id')
        .optional()
        .isMongoId().withMessage('client_id deve ser um ID válido')
        .trim(),
    (0, express_validator_1.query)('telefone')
        .optional()
        .trim()
        .escape(),
    (0, express_validator_1.query)('email')
        .optional()
        .trim()
        .escape(),
    (0, express_validator_1.query)('web_site')
        .optional()
        .trim()
        .escape(),
    (0, express_validator_1.query)('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano')
        .toBoolean(),
    (0, express_validator_1.query)('search')
        .optional()
        .trim()
        .escape(),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isIn(['publishedAt', 'email', 'telefone', 'isPrincipal']).withMessage('Campo de ordenação inválido'),
    (0, express_validator_1.query)('sortOrder')
        .optional()
        .isIn(['asc', 'desc']).withMessage('Ordem de ordenação deve ser asc ou desc')
];
router.post('/register', authentication_1.default, createContactValidation, (0, authorize_1.default)(['admin', 'user']), createContact_1.default);
router.get('/contacts', authentication_1.default, contactsPaginationValidation, validationError_1.default, (0, authorize_1.default)(['admin', 'user']), getContacts_1.default);
router.get('/:contact_id', authentication_1.default, contactIdValidation, validationError_1.default, (0, authorize_1.default)(['admin', 'user']), getContactById_1.default);
router.put('/contacts/:contact_id', authentication_1.default, updateContactValidation, validationError_1.default, (0, authorize_1.default)(['admin', 'user']), updateContactById_1.default);
router.delete('/contacts/:contact_id', authentication_1.default, contactIdValidation, validationError_1.default, (0, authorize_1.default)(['admin', 'user']), deleteContactById_1.default);
exports.default = router;
