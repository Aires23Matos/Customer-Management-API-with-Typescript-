import { logger } from "@/lib/winston";
import User from "@/models/user";
import type { Response, Request } from "express";

const getUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
   
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).select('-__v').exec();

        if(!user){
            res.status(404).json({
                code: 'NotFound',
                message: 'Usuário não encontrado'
            });
            return
        }
       
        res.status(200).json({
            user
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

export default getUser;