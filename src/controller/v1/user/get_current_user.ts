import { logger } from '@/lib/winston';
import User from '@/models/user';
import type { Response, Request } from 'express';

const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
	try {
        const userId = req.userId;

        const user = await User.findById(userId).select('-__v').lean().exec();

        res.status(200).json({
            user,
        });

	} catch (err) {
		res.status(500).json({
			code: 'ServerError',
			message: 'Erro interno do servidor',
			error: err,
		});

		logger.error('Erro ao obter o usuário atual', err);
	}
};

export default getCurrentUser;
