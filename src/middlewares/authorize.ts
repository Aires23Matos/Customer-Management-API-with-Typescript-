import { logger } from '@/lib/winston';
import User from '@/models/user';
import type { Response, Request, NextFunction } from 'express';

export type AuthRole = 'admin' | 'user';

const authorize = (roles: AuthRole[]) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const userId = req.userId;

		try {
			const user = await User.findById(userId).select('role').exec();

			if (!user) {
				return res.status(404).json({
					code: 'Notfound',
					message: 'Usuário não encontrado',
				});
			}

			if (!roles.includes(user.role)) {
				return res.status(403).json({
					code: 'AuthorizationError',
					message: 'Acesso negado, permissões insuficientes',
				});
			}

			next();
		} catch (err) {
			logger.error('Erro ao autorizar o usuário', err);

			return res.status(500).json({
				code: 'ServerError',
				message: 'Erro interno do servidor',
				error: err,
			});
		}
	};
};
export default authorize;
