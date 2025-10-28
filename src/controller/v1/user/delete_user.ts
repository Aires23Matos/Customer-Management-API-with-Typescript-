import { logger } from "@/lib/winston";
import User from "@/models/user";
import type { Request, Response } from "express";
import { param } from 'express-validator';

const deleteUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.params.userId;

  
    try {
        await User.deleteOne({_id: userId});

        logger.info('A user account has been deleted',{
            userId
        });

        res.sendStatus(204);
    } catch (err) {
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: err,
        });

        logger.error('Erro ao apagar o usuário atual', err);
    }
};

export default deleteUser;