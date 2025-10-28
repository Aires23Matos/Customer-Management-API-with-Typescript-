import { generateAccessToken, generateRefreshToken } from "src/lib/jwt";
import { logger } from "src/lib/winston";
import Config from "src/config";
import Token from "src/models/tokens";
import User from "src/models/user";
import type { Request, Response } from "express";
import type { IUser} from 'src/models/user';

type UserData = Pick<IUser, 'email'|'password'>

const Login = async(req: Request, res: Response): Promise<void> => {
    try{
        const {email} = req.body as UserData;

        const user = await User.findOne({email})
        .select('username email password role')
        .lean()
        .exec();

        if(!user) {
            res.status(404).json({
                code: 'NotFound',
                message: 'Usuário não encontrado'
            })
            return
        }
        
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        await Token.create({token: refreshToken, userId: user._id });
        logger.info('Atualizar token criado para o usuário',{
            userId: user._id,
            token: refreshToken
        })

        res.cookie('refreshToken', refreshToken,{
            httpOnly: true,
            secure: Config.node_env ==='production',
            sameSite: 'strict'
        })

        res.status(201).json({
           user:{
                username: user.username,
                email: user.email,
                role: user.role
           },
           accessToken
        });
        logger.info('Usuário iniciou a cessao com sucesso', user)
    }catch(err){
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: err
        });
        logger.error('Erro durante o registo do utilizador')
    }
}    

export default Login;