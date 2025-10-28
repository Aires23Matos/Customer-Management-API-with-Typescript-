import { logger } from "src/lib/winston";
import Token from "src/models/tokens";
import Config from "src/config";
import { Response, Request } from "express";
import RefreshToken from 'src/controller/v1/auth/refresh_token';

const Logout = async(req: Request, res: Response): Promise<void> => {
    try{
        const refreshToken = req.cookies.RefreshToken as string;

        if(refreshToken){
            await Token.deleteOne({token: refreshToken});
            logger.info('Token de atualização do usuário excluído com êxito',{
                userId: req.userId,
                token: refreshToken
            })
        }


        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure:Config.node_env === 'Production',
            sameSite: 'strict'
        })

        res.sendStatus(204);

        logger.info('Efetue logout do usuário com êxito',{
            userId: req.userId
        })
    }catch(err){
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: err
        });
        logger.error('Erro durante o sair do utilizador')
    }
}    

export default Logout;