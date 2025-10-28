import { Router } from 'express';
import { body, param, query } from 'express-validator';
import authentication from '@/middlewares/authentication';
import ValidationError from '@/middlewares/validationError';
import authorize from '@/middlewares/authorize';
import createContact from '@/controller/v1/contact/createContact';
import getContacts from '@/controller/v1/contact/getContacts';
import getContactById from '@/controller/v1/contact/getContactById';
import updateContactById from '@/controller/v1/contact/updateContactById';
import deleteContactById from '@/controller/v1/contact/deleteContactById';

const router = Router();

// Validações para Contactos
const createContactValidation = [
    body('client_id')
        .notEmpty().withMessage('client_id é obrigatório')
        .isMongoId().withMessage('client_id deve ser um ID válido'),
    body('web_site')
        .optional()
        .isURL().withMessage('Website deve ser uma URL válida')
        .trim(),
    body('email')
        .notEmpty().withMessage('Email é obrigatório')
        .isEmail().withMessage('Email deve ter um formato válido')
        .normalizeEmail()
        .trim(),
    body('telefone')
        .notEmpty().withMessage('Telefone é obrigatório')
        .isLength({ min: 9, max: 13 }).withMessage('Telefone deve ter entre 9 e 13 dígitos')
        .matches(/^[\d\s\(\)\-\.\+]+$/).withMessage('Telefone deve conter apenas números e caracteres de formatação')
        .trim(),
    body('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano')
];

const updateContactValidation = [
    param('contact_id')
        .notEmpty().withMessage('ID do contacto é obrigatório')
        .isMongoId().withMessage('ID do contacto deve ser um ID válido'),
    body('web_site')
        .optional()
        .isURL().withMessage('Website deve ser uma URL válida')
        .trim(),
    body('email')
        .optional()
        .isEmail().withMessage('Email deve ter um formato válido')
        .normalizeEmail()
        .trim(),
    body('telefone')
        .optional()
        .isLength({ min: 9, max: 13 }).withMessage('Telefone deve ter entre 9 e 13 dígitos')
        .matches(/^[\d\s\(\)\-\.\+]+$/).withMessage('Telefone deve conter apenas números e caracteres de formatação')
        .trim(),
    body('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano')
];

const contactIdValidation = [
    param('contact_id')
        .notEmpty().withMessage('ID do contacto é obrigatório')
        .isMongoId().withMessage('ID do contacto deve ser um ID válido')
];

const contactsPaginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit deve ser entre 1 e 100')
        .toInt(),
    query('client_id')
        .optional()
        .isMongoId().withMessage('client_id deve ser um ID válido')
        .trim(),
    query('telefone')
        .optional()
        .trim()
        .escape(),
    query('email')
        .optional()
        .trim()
        .escape(),
    query('web_site')
        .optional()
        .trim()
        .escape(),
    query('isPrincipal')
        .optional()
        .isBoolean().withMessage('isPrincipal deve ser booleano')
        .toBoolean(),
    query('search')
        .optional()
        .trim()
        .escape(),
    query('sortBy')
        .optional()
        .isIn(['publishedAt', 'email', 'telefone', 'isPrincipal']).withMessage('Campo de ordenação inválido'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc']).withMessage('Ordem de ordenação deve ser asc ou desc')
];

// Rotas de Contactos
router.post(
    '/register',
    authentication,
    createContactValidation,
    authorize(['admin', 'user']),
    createContact
);

router.get(
    '/contacts',
    authentication,
    contactsPaginationValidation,
    ValidationError,
    authorize(['admin', 'user']),
    getContacts
);

router.get(
    '/:contact_id',
    authentication,
    contactIdValidation,
    ValidationError,
    authorize(['admin', 'user']),
    getContactById
);

router.put(
    '/contacts/:contact_id',
    authentication,
    updateContactValidation,
    ValidationError,
    authorize(['admin', 'user']),
    updateContactById
);

router.delete(
    '/contacts/:contact_id',
    authentication,
    contactIdValidation,
    ValidationError,
    authorize(['admin', 'user']),
    deleteContactById
);

export default router;