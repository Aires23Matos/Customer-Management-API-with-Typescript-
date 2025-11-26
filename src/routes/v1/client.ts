import { Router } from 'express';
import { param, query, body } from 'express-validator';
import authentication from '@/middlewares/authentication';
import ValidationError from '@/middlewares/validationError';
import authorize from '@/middlewares/authorize';
import getAllClients from '@/controller/v1/client/getAllClients';
import getClientById from '@/controller/v1/client/getClientById';
import updateClient from '@/controller/v1/client/updateClient';
import deleteClient from '@/controller/v1/client/deleteClient';
import {
    blockClient,
    unblockClient,
    getBlockedClients,
    checkClientBlockStatus
} from '@/controller/v1/client/blockedClientsController';

const router = Router();

const clientIdValidation = [
    param('client_id').notEmpty().withMessage('ID do cliente é obrigatório'),
];

const updateClientValidation = [
    param('client_id').notEmpty().withMessage('ID do cliente é obrigatório'),
    body('clientName')
        .optional()
        .isLength({ max: 20 })
        .withMessage('Nome deve ter no máximo 20 caracteres')
        .trim()
        .escape(),
    body('nif')
        .optional()
        .isString()
        .withMessage('NIF deve conter apenas números')
        .isLength({ min: 10, max: 14 })
        .withMessage('NIF deve ter exatamente 14 dígitos'),
    body('enderecos').optional().isArray(),
    body('contatos').optional().isArray(),
    body('licencas').optional().isArray(),
    body('responsaveis').optional().isArray(),
];

const blockClientValidation = [
    body('clientId')
        .notEmpty()
        .withMessage('ID do cliente é obrigatório')
        .trim()
        .escape(),
    body('motivo')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Motivo deve ter no máximo 500 caracteres')
        .trim()
        .escape(),
];

const unblockClientValidation = [
    body('clientId')
        .notEmpty()
        .withMessage('ID do cliente é obrigatório')
        .trim()
        .escape(),
];


router.get(
    '/clients',
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit deve ser entre 1 e 100'),
    ValidationError,
    authentication,
    authorize(['admin', 'user']),
    getAllClients,
);

router.get(
    '/getById/:client_id',
    clientIdValidation,
    ValidationError,
    authentication,
    authorize(['admin', 'user']),
    getClientById,
);

router.put(
    '/update/:client_id',
    updateClientValidation,
    ValidationError,
    authentication,
    authorize(['admin', 'user']),
    updateClient,
);

router.delete(
    '/delete/:client_id',
    clientIdValidation,
    ValidationError,
    authentication,
    authorize(['admin', 'user']),
    deleteClient,
);


router.post(
    '/block',
    blockClientValidation,
    ValidationError,
    authentication,
    authorize(['admin']), 
    blockClient,
);


router.post(
    '/unblock',
    unblockClientValidation,
    ValidationError,
    authentication,
    authorize(['admin']), 
    unblockClient,
);


router.get(
    '/blocked',
    ValidationError,
    authentication,
    authorize(['admin', 'user']), 
    getBlockedClients,
);


router.get(
    '/:client_id/block-status',
    clientIdValidation,
    ValidationError,
    authentication,
    authorize(['admin', 'user']),
    checkClientBlockStatus,
);

export default router;