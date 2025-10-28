import { Router } from 'express';
import { body, param, query } from 'express-validator';
import authentication from '@/middlewares/authentication';
import ValidationError from '@/middlewares/validationError';
import authorize from '@/middlewares/authorize';
import createAccountable from '@/controller/v1/accountable/createAccountable';
import getAccountables from '@/controller/v1/accountable/getAccountables';
import getAccountableById from '@/controller/v1/accountable/getAccountableById';
import updateAccountableById from '@/controller/v1/accountable/updateAccountableById';
import deleteAccountableById from '@/controller/v1/accountable/deleteAccountableById';


const router = Router();

// Validações para Accountable
const createAccountableValidation = [
    body('client_id')
        .notEmpty().withMessage('client_id é obrigatório'),
    body('nome')
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ max: 50 }).withMessage('Nome deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    body('email')
        .notEmpty().withMessage('Email é obrigatório')
        .isEmail().withMessage('Formato de email inválido')
        .normalizeEmail(),
    body('telefone')
        .notEmpty().withMessage('Telefone é obrigatório')
        .matches(/^\d{9,13}$/).withMessage('Telefone deve ter 9-13 dígitos')
        .trim()
        .escape(),
    body('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano')
];

const updateAccountableValidation = [
    param('accountable_id')
        .notEmpty().withMessage('ID do responsável é obrigatório'),
    body('nome')
        .optional()
        .isLength({ max: 50 }).withMessage('Nome deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    body('email')
        .optional()
        .isEmail().withMessage('Formato de email inválido')
        .normalizeEmail(),
    body('telefone')
        .optional()
        .matches(/^\d{9,13}$/).withMessage('Telefone deve ter 9-13 dígitos')
        .trim()
        .escape(),
    body('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano')
];

const accountableIdValidation = [
    param('accountable_id')
        .notEmpty().withMessage('ID do responsável é obrigatório')
];

const accountablesPaginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit deve ser entre 1 e 100'),
    query('client_id').optional().trim(),
    query('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano'),
    query('search').optional().trim().escape()
];

// Rotas de Accountable 
router.post(
    '/register',
    authentication,
    authorize(['admin', 'user']),
    createAccountableValidation,
    ValidationError,
    createAccountable
);

router.get(
    '/accountables',
    authentication,
    authorize(['admin', 'user']),
    accountablesPaginationValidation,
    ValidationError,
    getAccountables
);

router.get(
    '/:accountable_id',
    authentication,
    authorize(['admin', 'user']),
    accountableIdValidation,
    ValidationError,
    getAccountableById
);

router.put(
    '/:accountable_id',
    authentication,
    authorize(['admin', 'user']),
    updateAccountableValidation,
    ValidationError,
    updateAccountableById
);

router.delete(
    '/:accountable_id',
    authentication,
    authorize(['admin', 'user']),
    accountableIdValidation,
    ValidationError,
    deleteAccountableById
);


export default router;