import  jwt  from "jsonwebtoken";
import Config from "src/config";
import { Types } from "mongoose";


export const generateAccessToken = (userId: Types.ObjectId): string => {
    return jwt.sign({userId}, Config.jwt_access_secret, {
        expiresIn: Config.access_token_expiry,
        subject: 'accessApi'
    })
};

export const generateRefreshToken = (userId: Types.ObjectId): string => {
    return jwt.sign({userId}, Config.jwt_access_refresh, {
        expiresIn: Config.refresh_token_expiry,
        subject: 'refreshToken'
    })
};

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, Config.jwt_access_secret);
}

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, Config.jwt_access_refresh);
}