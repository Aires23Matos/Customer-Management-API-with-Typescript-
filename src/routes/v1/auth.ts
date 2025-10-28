import { Router } from 'express';
import Register from 'src/controller/v1/auth/register';
import Login from 'src/controller/v1/auth/login';
import { body, cookie } from 'express-validator';
import ValidationError from 'src/middlewares/validationError';
import User from 'src/models/user';
import bcrypt from 'bcrypt';
import RefreshToken from 'src/controller/v1/auth/refresh_token';
import Logout from 'src/controller/v1/auth/logout';
import authentication from 'src/middlewares/authentication';
import createClient from '@/controller/v1/client/create_client';

const router = Router();

router.post(
	'/register',
	body('email')
		.trim()
		.notEmpty()
		.withMessage('O e-mail é obrigatório')
		.isLength({ max: 50 })
		.withMessage('O e-mail deve ter menos de 50 caracteres')
		.isEmail()
		.withMessage('Endereço de e-mail inválido')
		.custom(async (value) => {
			const userExist = await User.exists({ email: value });
			if (userExist) {
				throw new Error('Usuário já existe');
			}
		}),
	body('password')
		.optional()
		.isLength({ min: 4 })
		.withMessage('A palavra-passe tem de ter, pelo menos, 4 caracteres')
		.isString()
		.withMessage('A função deve ser uma cadeia de caracteres')
		.isIn(['admin', 'user'])
		.withMessage('A função deve ser de administrador ou usuário'),
	// ValidationError,
	Register,
);

router.post(
	'/login',
	body('email')
		.trim()
		.notEmpty()
		.withMessage('O e-mail é obrigatório')
		.isLength({ max: 50 })
		.withMessage('O e-mail deve ter menos de 50 caracteres')
		.isEmail()
		.withMessage('Endereço de e-mail inválido')
		.custom(async (value) => {
			const userExist = await User.exists({ email: value });
			if (!userExist) {
				throw new Error(
					'O e-mail ou a palavra-passe do utilizador são inválidos',
				);
			}
		}),
	body('password')
		.notEmpty()
		.withMessage('A palavra-passe é necessária')
		.isLength({ min: 4 })
		.withMessage('A palavra-passe tem de ter, pelo menos, 4 caracteres')
		.custom(async (value, { req }) => {
			const { email } = req.body as { email: string };
			const user = await User.findOne({ email })
				.select('password')
				.lean()
				.exec();

			if (!user) {
				throw new Error(
					'O e-mail ou a palavra-passe do utilizador são inválidos',
				);
			}

			const passwordMatch = await bcrypt.compare(value, user.password);

			if (!passwordMatch) {
				throw new Error(
					'O e-mail ou a palavra-passe do utilizador são inválidos',
				);
			}
		}),
	ValidationError,
	Login,
);

router.post(
	'/refresh-token',
	cookie('refreshToken')
		.notEmpty()
		.withMessage('Atualizar token necessário')
		.isJWT()
		.withMessage('Token de atualização inválido'),
	RefreshToken,
);

router.post('/logout', authentication, Logout);

router.post("/register/client",
	 body('clientName')
		.notEmpty().withMessage('Nome do cliente é obrigatório')
		.isLength({ max: 20 }).withMessage('Nome deve ter no máximo 20 caracteres')
		.trim()
		.escape(),
	body('nif')
		.isNumeric().withMessage('NIF deve conter apenas números')
		.isLength({ min: 9, max: 9 }).withMessage('NIF deve ter exatamente 9 dígitos'),
	authentication,
	createClient
);


export default router;
