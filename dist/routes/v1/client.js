"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authentication_1 = __importDefault(require("../../middlewares/authentication"));
const validationError_1 = __importDefault(require("../../middlewares/validationError"));
const authorize_1 = __importDefault(require("../../middlewares/authorize"));
const getAllClients_1 = __importDefault(require("../../controller/v1/client/getAllClients"));
const getClientById_1 = __importDefault(require("../../controller/v1/client/getClientById"));
const updateClient_1 = __importDefault(require("../../controller/v1/client/updateClient"));
const deleteClient_1 = __importDefault(require("../../controller/v1/client/deleteClient"));
const blockedClientsController_1 = require("@/controller/v1/client/blockedClientsController");
const router = (0, express_1.Router)();
const clientIdValidation = [
    (0, express_validator_1.param)('client_id').notEmpty().withMessage('ID do cliente é obrigatório'),
];
const updateClientValidation = [
    (0, express_validator_1.param)('client_id').notEmpty().withMessage('ID do cliente é obrigatório'),
    (0, express_validator_1.body)('clientName')
        .optional()
        .isLength({ max: 20 })
        .withMessage('Nome deve ter no máximo 20 caracteres')
        .trim()
        .escape(),
    (0, express_validator_1.body)('nif')
        .optional()
        .isString()
        .withMessage('NIF deve conter apenas números')
        .isLength({ min: 10, max: 14 })
        .withMessage('NIF deve ter exatamente 14 dígitos'),
    (0, express_validator_1.body)('enderecos').optional().isArray(),
    (0, express_validator_1.body)('contatos').optional().isArray(),
    (0, express_validator_1.body)('licencas').optional().isArray(),
    (0, express_validator_1.body)('responsaveis').optional().isArray(),
];
const blockClientValidation = [
    (0, express_validator_1.body)('clientId')
        .notEmpty()
        .withMessage('ID do cliente é obrigatório')
        .trim()
        .escape(),
    (0, express_validator_1.body)('motivo')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Motivo deve ter no máximo 500 caracteres')
        .trim()
        .escape(),
];
const unblockClientValidation = [
    (0, express_validator_1.body)('clientId')
        .notEmpty()
        .withMessage('ID do cliente é obrigatório')
        .trim()
        .escape(),
];
router.get('/clients', (0, express_validator_1.query)('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit deve ser entre 1 e 100'), validationError_1.default, authentication_1.default, (0, authorize_1.default)(['admin', 'user']), getAllClients_1.default);
router.get('/getById/:client_id', clientIdValidation, validationError_1.default, authentication_1.default, (0, authorize_1.default)(['admin', 'user']), getClientById_1.default);
router.put('/update/:client_id', updateClientValidation, validationError_1.default, authentication_1.default, (0, authorize_1.default)(['admin', 'user']), updateClient_1.default);
router.delete('/delete/:client_id', clientIdValidation, validationError_1.default, authentication_1.default, (0, authorize_1.default)(['admin', 'user']), deleteClient_1.default);
router.post('/block', blockClientValidation, validationError_1.default, authentication_1.default, (0, authorize_1.default)(['admin']), blockedClientsController_1.blockClient);
router.post('/unblock', unblockClientValidation, validationError_1.default, authentication_1.default, (0, authorize_1.default)(['admin']), blockedClientsController_1.unblockClient);
router.get('/blocked', validationError_1.default, authentication_1.default, (0, authorize_1.default)(['admin', 'user']), blockedClientsController_1.getBlockedClients);
router.get('/:client_id/block-status', clientIdValidation, validationError_1.default, authentication_1.default, (0, authorize_1.default)(['admin', 'user']), blockedClientsController_1.checkClientBlockStatus);
exports.default = router;
