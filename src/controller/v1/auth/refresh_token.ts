import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { logger } from "src/lib/winston";
import Token from "src/models/tokens";
import type { Response, Request } from "express";
import {Types} from 'mongoose';
import { verifyRefreshToken, generateAccessToken } from "src/lib/jwt";

const RefreshToken = async(req:Request, res:Response) => {
    const refreshToken = req.cookies.refreshToken as string;

    try{
        const tokensExist = await Token.exists({token: refreshToken});

        if(!tokensExist){
            res.status(401).json({
                code: 'AuthenticationError',
                message: 'Invalid refresh token'
            });
            return;
        }

        const jwtPayload = verifyRefreshToken(refreshToken) as {userId: Types.ObjectId}
        
        const accessToken = generateAccessToken(jwtPayload.userId);

        res.status(200).json({
            accessToken,
        })
    }catch(err){
        if(err instanceof TokenExpiredError){
            res.status(401).json({
                code: 'AuthenticationError',
                message: 'Refresh token expired, please login again'
            });
            return;
        }

        if(err instanceof JsonWebTokenError){
            res.status(401).json({
                code:'AuthenticationError',
                message: 'Invalid refresh token'
            });
            return;
        }

        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
            error: err
        });
        logger.error('Error during refresh token', err);
    }
}


export default RefreshToken;