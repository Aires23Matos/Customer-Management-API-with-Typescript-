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
const deleteLicenseDataById_1 = __importDefault(require("@/controller/v1/licenseData/deleteLicenseDataById"));
const updateLicenseDataById_1 = __importDefault(require("@/controller/v1/licenseData/updateLicenseDataById"));
const getLicenseDataById_1 = __importDefault(require("@/controller/v1/licenseData/getLicenseDataById"));
const getLicensesData_1 = __importDefault(require("@/controller/v1/licenseData/getLicensesData"));
const createLicenseData_1 = __importDefault(require("@/controller/v1/licenseData/createLicenseData"));
const router = (0, express_1.Router)();
const createLicenseDataValidation = [
    (0, express_validator_1.body)('client_id').notEmpty().withMessage('client_id é obrigatório'),
    (0, express_validator_1.body)('tecnico')
        .notEmpty()
        .withMessage('Nome do técnico é obrigatório')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome do técnico deve ter entre 2 e 100 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('localizacao')
        .notEmpty()
        .withMessage('localizacão é obrigatório')
        .isLength({ min: 2, max: 100 })
        .withMessage('localizacão deve ter entre 2 e 100 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('numeroLicenca')
        .notEmpty()
        .withMessage('Número da licença é obrigatório')
        .trim()
        .escape(),
    (0, express_validator_1.body)('data_da_instalacao')
        .notEmpty()
        .withMessage('Data de instalação é obrigatória')
        .isISO8601()
        .withMessage('Formato de data inválido'),
    (0, express_validator_1.body)('data_da_ativacao')
        .notEmpty()
        .withMessage('Data de ativação é obrigatória')
        .isISO8601()
        .withMessage('Formato de data inválido'),
    (0, express_validator_1.body)('data_da_expiracao')
        .notEmpty()
        .withMessage('Data de expiração é obrigatória')
        .isISO8601()
        .withMessage('Formato de data inválido'),
    (0, express_validator_1.body)('hora_de_formacao')
        .notEmpty()
        .withMessage('Hora de formação é obrigatória')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de hora inválido (HH:MM)'),
    (0, express_validator_1.body)('validade_em_mes')
        .notEmpty()
        .withMessage('Validade em meses é obrigatória')
        .isInt({ min: 1, max: 120 })
        .withMessage('Validade deve ser entre 1 e 120 meses'),
    (0, express_validator_1.body)('conta_pago')
        .optional()
        .isIn(['Pago', 'Não Pago', 'Pendente', 'Parcial'])
        .withMessage('Estado deve ser: Pago, Não Pago ou Pendente'),
    (0, express_validator_1.body)('valor_pago')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Valor pago não pode ser negativo'),
    (0, express_validator_1.body)('estado')
        .optional()
        .isIn(['ativa', 'expirada', 'suspensa', 'pendente'])
        .withMessage('Estado deve ser: ativa, expirada, suspensa ou pendente'),
];
const updateLicenseDataValidation = [
    (0, express_validator_1.param)('license_id').notEmpty().withMessage('ID da licença é obrigatório'),
    (0, express_validator_1.body)('tecnico')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome do técnico deve ter entre 2 e 100 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('numeroLicenca').optional().trim().escape(),
    (0, express_validator_1.body)('data_da_instalacao')
        .optional()
        .isISO8601()
        .withMessage('Formato de data inválido'),
    (0, express_validator_1.body)('data_da_ativacao')
        .optional()
        .isISO8601()
        .withMessage('Formato de data inválido'),
    (0, express_validator_1.body)('data_da_expiracao')
        .optional()
        .isISO8601()
        .withMessage('Formato de data inválido'),
    (0, express_validator_1.body)('hora_de_formacao')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Formato de hora inválido (HH:MM)'),
    (0, express_validator_1.body)('validade_em_mes')
        .optional()
        .isInt({ min: 1, max: 120 })
        .withMessage('Validade deve ser entre 1 e 120 meses'),
    (0, express_validator_1.body)('conta_pago')
        .optional()
        .isIn(['Pago', 'Não Pago', 'Pendente', 'Parcial'])
        .withMessage('Estado deve ser: Pago, Não Pago ou Pendente'),
    (0, express_validator_1.body)('valor_pago')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Valor pago não pode ser negativo'),
    (0, express_validator_1.body)('estado')
        .optional()
        .isIn(['ativa', 'expirada', 'suspensa', 'pendente'])
        .withMessage('Estado deve ser: ativa, expirada, suspensa ou pendente'),
];
const licenseIdValidation = [
    (0, express_validator_1.param)('license_id').notEmpty().withMessage('ID da licença é obrigatório'),
];
const licensesPaginationValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página deve ser um número inteiro positivo'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit deve ser entre 1 e 100'),
    (0, express_validator_1.query)('client_id').optional().trim(),
    (0, express_validator_1.query)('estado')
        .optional()
        .isIn(['ativa', 'expirada', 'suspensa', 'pendente'])
        .withMessage('Estado deve ser: ativa, expirada, suspensa ou pendente'),
    (0, express_validator_1.query)('conta_pago')
        .optional()
        .isIn(['Pago', 'Não Pago', 'Pendente', 'Parcial'])
        .withMessage('Estado deve ser: Pago, Não Pago ou Pendente'),
    (0, express_validator_1.query)('expiradas')
        .optional()
        .isBoolean()
        .withMessage('expiradas deve ser booleano'),
    (0, express_validator_1.query)('search').optional().trim().escape(),
];
router.post('/register', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), createLicenseDataValidation, validationError_1.default, createLicenseData_1.default);
router.get('/licenses', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), licensesPaginationValidation, validationError_1.default, getLicensesData_1.default);
router.get('/:license_id', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), licenseIdValidation, validationError_1.default, getLicenseDataById_1.default);
router.put('/update/:license_id', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), updateLicenseDataValidation, validationError_1.default, updateLicenseDataById_1.default);
router.delete('/:license_id', authentication_1.default, (0, authorize_1.default)(['admin', 'user']), licenseIdValidation, validationError_1.default, deleteLicenseDataById_1.default);
exports.default = router;
