import { Router } from 'express';
import { param, query, body } from 'express-validator';
import authentication from '@/middlewares/authentication';
import ValidationError from '@/middlewares/validationError';
import authorize from '@/middlewares/authorize';
import User from '@/models/user';
import getCurrentUser from '@/controller/v1/user/get_current_user';
import updateCurrentUser from '@/controller/v1/user/update_current_user';
import deleteCurrentUser from '@/controller/v1/user/delete_current_user';
import getAllUsers from '@/controller/v1/user/get_all_users';
import getUser from '@/controller/v1/user/get_user';
import deleteUser from '@/controller/v1/user/delete_user';

const router = Router();

router.get(
	'/current',
	authentication,
	authorize(['admin', 'user']),
	getCurrentUser,
);



router.delete(
	'/delete/current',
	authentication,
	authorize(['admin', 'user']),
	deleteCurrentUser,
);

router.get(
	'/',
	authentication,
	query('limit')
		.optional()
		.isInt({ min: 1, max: 50 })
		.withMessage('O limite deve ser entre 1 a 50'),
	query('offset')
		.optional()
		.isInt({ min: 0 })
		.withMessage('O deslocamento deve ser um número inteiro positivo'),
	ValidationError,
	authorize(['admin']),
	getAllUsers,
);

router.get(
	'/:userId',
	authentication,
	authorize(['admin']),
	param('userId').notEmpty().isMongoId().withMessage('Invalid user ID'),
	ValidationError,
	getUser,
);

router.put(
	'/:current_id',
	authorize(['admin', 'user']),
	authentication,
	body('username')
		.optional()
		.trim()
		.isLength({ max: 20 })
		.withMessage('O nome de usuário deve ter menos de 20 caracteres')
		.custom(async (value) => {
			const userExist = await User.exists({ username: value });

			if (userExist) {
				throw Error('Este nome de utilizador já está a ser utilizado');
			}
		}),
	body('email')
		.optional()
		.isLength({ max: 50 })
		.withMessage('O e-mail deve ter menos de 50 caracteres')
		.isEmail()
		.withMessage('Endereço de e-mail inválido')
		.custom(async (value) => {
			const useExist = await User.exists({ email: value });

			if (useExist) {
				throw Error('Este e-mail já está em uso');
			}
		}),
	body('password')
		.optional()
		.isLength({ min: 8 })
		.withMessage('A palavra-passe tem de ter, pelo menos, 8 caractere'),
	body('first_name')
		.optional()
		.isLength({ max: 20 })
		.withMessage('O nome próprio deve ter menos de 20 caracteres'),
	body('last_name')
		.optional()
		.isLength({ max: 20 })
		.withMessage('O sobrenome deve ter menos de 20 caracteres'),
	ValidationError,
	
	updateCurrentUser,
);

router.delete(
	'/delete/:userId',
	authentication,
	authorize(['admin']),
	param('userId').notEmpty().isMongoId().withMessage('Invalid user ID'),
	ValidationError,
	deleteUser,
);
export default router;
