import { logger } from '@/lib/winston';
import User from '@/models/user';
import type { Response, Request } from 'express';

const updateCurrentUser = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const userId = req.userId;

	const { username, email, password, first_name, last_name } = req.body;
	try {
        const user = await User.findById(userId).select('+password -__v').exec();

        if (!user){
            res.status(404).json({
                code: 'NotFound',
                message: 'User not found'
            });
            return;
        }
        if(username) user.username = username;
        if(email) user.email = email;
        if(password) user.password = password;
        if(first_name) user.firstName = first_name;
        if(last_name) user.lastName = last_name;

        await user.save();
        logger.info('User update successfully', user);

        res.status(200).json({
            user,
        })
	} catch (err) {
		res.status(500).json({
			code: 'ServerError',
			message: 'Erro interno do servidor',
			error: err,
		});

		logger.error('Erro ao atualizar o usuário atual', err);
	}
};

export default updateCurrentUser;
