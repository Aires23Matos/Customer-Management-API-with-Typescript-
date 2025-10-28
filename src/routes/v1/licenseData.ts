import { Router } from 'express';
import { body, param, query } from 'express-validator';
import authentication from '@/middlewares/authentication';
import ValidationError from '@/middlewares/validationError';
import authorize from '@/middlewares/authorize';
import deleteLicenseDataById from '@/controller/v1/licenseData/deleteLicenseDataById';
import updateLicenseDataById from '@/controller/v1/licenseData/updateLicenseDataById';
import getLicenseDataById from '@/controller/v1/licenseData/getLicenseDataById';
import getLicensesData from '@/controller/v1/licenseData/getLicensesData';
import createLicenseData from '@/controller/v1/licenseData/createLicenseData';

const router = Router();

// Validações para LicenseData
const createLicenseDataValidation = [
	body('client_id').notEmpty().withMessage('client_id é obrigatório'),
	body('tecnico')
		.notEmpty()
		.withMessage('Nome do técnico é obrigatório')
		.isLength({ min: 2, max: 100 })
		.withMessage('Nome do técnico deve ter entre 2 e 100 caracteres')
		.trim()
		.escape(),
	body('numeroLicenca')
		.notEmpty()
		.withMessage('Número da licença é obrigatório')
		.trim()
		.escape(),
	body('data_da_instalacao')
		.notEmpty()
		.withMessage('Data de instalação é obrigatória')
		.isISO8601()
		.withMessage('Formato de data inválido'),
	body('data_da_ativacao')
		.notEmpty()
		.withMessage('Data de ativação é obrigatória')
		.isISO8601()
		.withMessage('Formato de data inválido'),
	body('data_da_expiracao')
		.notEmpty()
		.withMessage('Data de expiração é obrigatória')
		.isISO8601()
		.withMessage('Formato de data inválido'),
	body('hora_de_formacao')
		.notEmpty()
		.withMessage('Hora de formação é obrigatória')
		.matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
		.withMessage('Formato de hora inválido (HH:MM)'),
	body('validade_em_mes')
		.notEmpty()
		.withMessage('Validade em meses é obrigatória')
		.isInt({ min: 1, max: 120 })
		.withMessage('Validade deve ser entre 1 e 120 meses'),
	body('conta_pago')
		.optional()
		.isIn(['Pago', 'Não Pago', 'Pendente'])
		.withMessage('Estado deve ser: Pago, Não Pago ou Pendente'),
	body('valor_pago')
		.optional()
		.isFloat({ min: 0 })
		.withMessage('Valor pago não pode ser negativo'),
	body('estado')
		.optional()
		.isIn(['ativa', 'expirada', 'suspensa', 'pendente'])
		.withMessage('Estado deve ser: ativa, expirada, suspensa ou pendente'),
];

const updateLicenseDataValidation = [
	param('license_id').notEmpty().withMessage('ID da licença é obrigatório'),
	body('tecnico')
		.optional()
		.isLength({ min: 2, max: 100 })
		.withMessage('Nome do técnico deve ter entre 2 e 100 caracteres')
		.trim()
		.escape(),
	body('numeroLicenca').optional().trim().escape(),
	body('data_da_instalacao')
		.optional()
		.isISO8601()
		.withMessage('Formato de data inválido'),
	body('data_da_ativacao')
		.optional()
		.isISO8601()
		.withMessage('Formato de data inválido'),
	body('data_da_expiracao')
		.optional()
		.isISO8601()
		.withMessage('Formato de data inválido'),
	body('hora_de_formacao')
		.optional()
		.matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
		.withMessage('Formato de hora inválido (HH:MM)'),
	body('validade_em_mes')
		.optional()
		.isInt({ min: 1, max: 120 })
		.withMessage('Validade deve ser entre 1 e 120 meses'),
	body('conta_pago')
		.optional()
		.isIn(['Pago', 'Não Pago', 'Pendente'])
		.withMessage('Estado deve ser: Pago, Não Pago ou Pendente'),
	body('valor_pago')
		.optional()
		.isFloat({ min: 0 })
		.withMessage('Valor pago não pode ser negativo'),
	body('estado')
		.optional()
		.isIn(['ativa', 'expirada', 'suspensa', 'pendente'])
		.withMessage('Estado deve ser: ativa, expirada, suspensa ou pendente'),
];

const licenseIdValidation = [
	param('license_id').notEmpty().withMessage('ID da licença é obrigatório'),
];

const licensesPaginationValidation = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Página deve ser um número inteiro positivo'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Limit deve ser entre 1 e 100'),
	query('client_id').optional().trim(),
	query('estado')
		.optional()
		.isIn(['ativa', 'expirada', 'suspensa', 'pendente'])
		.withMessage('Estado deve ser: ativa, expirada, suspensa ou pendente'),
	query('conta_pago')
		.optional()
		.isIn(['Pago', 'Não Pago', 'Pendente'])
		.withMessage('Estado deve ser: Pago, Não Pago ou Pendente'),
	query('expiradas')
		.optional()
		.isBoolean()
		.withMessage('expiradas deve ser booleano'),
	query('search').optional().trim().escape(),
];

// Rotas de LicenseData
router.post(
	'/register',
	authentication,
	authorize(['admin', 'user']),
	createLicenseDataValidation,
	ValidationError,
	createLicenseData,
);

router.get(
	'/licenses',
	authentication,
	authorize(['admin', 'user']),
	licensesPaginationValidation,
	ValidationError,
	getLicensesData,
);

router.get(
	'/:license_id',
	authentication,
	authorize(['admin', 'user']),
	licenseIdValidation,
	ValidationError,
	getLicenseDataById,
);

router.put(
	'/:license_id',
	authentication,
	authorize(['admin', 'user']),
	updateLicenseDataValidation,
	ValidationError,
	updateLicenseDataById,
);

router.delete(
	'/:license_id',
	authentication,
	authorize(['admin', 'user']),
	licenseIdValidation,
	ValidationError,
	deleteLicenseDataById,
);

export default router;
