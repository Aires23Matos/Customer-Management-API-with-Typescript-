import { logger } from "@/lib/winston";
import User from "@/models/user";
import type { Response, Request} from 'express';
import Config from "@/config";

const getAllUsers = async (
    req: Request,
    res: Response,
): Promise<void> => {

    try {
        const limit = parseInt(req.query.limit as string) ?? Config.defaultResLimit;
        const offset = parseInt(req.query.office as string) ?? Config.defaultResOffset;

        const total = await User.countDocuments();
        const users = await User.find()
        .select('-__v')
        .limit(limit)
        .skip(offset)
        .lean()
        .exec();

        res.status(200).json({
            limit,
            offset,
            total,
            users
        })
    } catch (err) {
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: err,
        });

        logger.error('Erro ao buscando todos usuário atuais', err);
    }
};

export default getAllUsers;
