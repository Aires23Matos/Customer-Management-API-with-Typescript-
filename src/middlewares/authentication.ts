import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { verifyAccessToken } from "src/lib/jwt";
import { logger } from "src/lib/winston";
import { Response, Request, NextFunction } from "express";
import type { Types } from "mongoose";


const authentication = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

   if(!authHeader?.startsWith('Bearer')){
        res.status(401).json({
            code: 'AuthenticationError',
            message: 'Acesso negado, nenhum token fornecido',
        });
        return;
   }

   const [_,token] = authHeader.split(' ');
   try{
    const jwtPayload = verifyAccessToken(token) as {userId:Types.ObjectId};
    req.userId = jwtPayload.userId;

    return next();
   }catch(err){
    if(err instanceof TokenExpiredError){
       res.status(401).json({
        code: 'AuthenticationError',
        message: 'Token de acesso expirado, solicite um novo com token de atualização',
       });
       return; 
    }

    if(err instanceof JsonWebTokenError){
        res.status(401).json({
            code: 'AuthenticationError',
            message: 'Token de acesso inválido'
        })
        return;
    }

    res.status(500).json({
        code: 'ServerError',
        message: 'Erro interno do servidor',
        error: err
    });
    logger.error('Erro durante a autenticação', err);
   }
}

export default authentication;