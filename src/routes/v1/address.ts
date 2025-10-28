import { Router } from 'express';
import { body, param, query } from 'express-validator';
import authentication from '@/middlewares/authentication';
import ValidationError from '@/middlewares/validationError';
import authorize from '@/middlewares/authorize';
import createAddress from '@/controller/v1/address/createAddress';
import getAddresses from '@/controller/v1/address/getAddresses';
import getAddressById from '@/controller/v1/address/getAddressById';
import updateAddressById from '@/controller/v1/address/updateAddressById';
import deleteAddressById from '@/controller/v1/address/deleteAddressById';


const router = Router();


// Validações para Address
const createAddressValidation = [
    body('client_id')
        .notEmpty().withMessage('client_id é obrigatório'),
    body('provincia')
        .notEmpty().withMessage('Provincia é obrigatória')
        .isLength({ max: 10 }).withMessage('Provincia deve ter no máximo 10 caracteres')
        .trim()
        .escape(),
    body('municipio')
        .notEmpty().withMessage('Municipio é obrigatório')
        .isLength({ max: 50 }).withMessage('Municipio deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    body('bairro')
        .notEmpty().withMessage('Bairro é obrigatório')
        .isLength({ max: 50 }).withMessage('Bairro deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    body('rua_ou_avenida')
        .notEmpty().withMessage('Rua ou avenida é obrigatória')
        .isLength({ max: 50 }).withMessage('Rua ou avenida deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    body('numero_da_casa')
        .notEmpty().withMessage('Número da casa é obrigatório')
        .isLength({ max: 50 }).withMessage('Número da casa deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    body('ponto_de_referencia')
        .optional()
        .trim()
        .escape()
];

const updateAddressValidation = [
    param('address_id')
        .notEmpty().withMessage('ID do endereço é obrigatório'),
    body('provincia')
        .optional()
        .isLength({ max: 10 }).withMessage('Provincia deve ter no máximo 10 caracteres')
        .trim()
        .escape(),
    body('municipio')
        .optional()
        .isLength({ max: 50 }).withMessage('Municipio deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    body('bairro')
        .optional()
        .isLength({ max: 50 }).withMessage('Bairro deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    body('rua_ou_avenida')
        .optional()
        .isLength({ max: 50 }).withMessage('Rua ou avenida deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    body('numero_da_casa')
        .optional()
        .isLength({ max: 50 }).withMessage('Número da casa deve ter no máximo 50 caracteres')
        .trim()
        .escape(),
    body('ponto_de_referencia')
        .optional()
        .trim()
        .escape()
];

const addressIdValidation = [
    param('address_id')
        .notEmpty().withMessage('ID do endereço é obrigatório')
];

const addressesPaginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit deve ser entre 1 e 100'),
    query('client_id').optional().trim(),
    query('provincia').optional().trim().escape(),
    query('municipio').optional().trim().escape(),
    query('bairro').optional().trim().escape(),
    query('search').optional().trim().escape()
];

// Rotas de Address (novas)
router.post(
    '/register',
    authentication,
    authorize(['admin', 'user']),
    createAddressValidation,
    ValidationError,
    createAddress
);

router.get(
    '/addresses',
    authentication,
    authorize(['admin', 'user']),
    addressesPaginationValidation,
    ValidationError,
    getAddresses
);

router.get(
    '/:address_id',
    authentication,
    authorize(['admin', 'user']),
    addressIdValidation,
    ValidationError,
    getAddressById
);

router.put(
    '/:address_id',
    authentication,
    authorize(['admin', 'user']),
    updateAddressValidation,
    ValidationError,
    updateAddressById
);

router.delete(
    '/:address_id',
    authentication,
    authorize(['admin', 'user']),
    addressIdValidation,
    ValidationError,
    deleteAddressById
);



export default router;