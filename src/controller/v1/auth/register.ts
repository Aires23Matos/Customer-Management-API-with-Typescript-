import { logger } from "src/lib/winston";
import Config from "src/config";
import User from "src/models/user";
import Token from "src/models/tokens";

import type { IUser } from "src/models/user";
import type {Request, Response} from 'express';
import { genUsername } from "src/utils";
import { generateAccessToken, generateRefreshToken } from "src/lib/jwt";

type UserData = Pick<IUser, 'email' |'password'|'role'>& {
    firstName?: string;
    lastName?: string;
}

const Register = async(req:Request , res: Response): Promise<void> => {
    const {email, password, role, firstName, lastName} = req.body as UserData;

    console.log('Dados recebidos:', {email, password, role, firstName, lastName});
    
    if(role === 'admin' && !Config.whitelist_admins_mail.includes(email)){
        res.status(403).json({
            code: 'AuthorizationError',
            message: 'Não é possível registar-se como administrador'
        });

        logger.warn(`Usuário com e-mail ${email} tentou se registrar como administrador, mas não está na lista branca`);
        return;
    }

    try{
        const username = genUsername();

        console.log('Tentando criar usuário com:', {
            username, email, role, firstName, lastName
        });

        const newUser = await User.create({
            username,
            email,
            password,
            role,
            ...(firstName && { firstName }),
            ...(lastName && { lastName })
        });

        console.log('Usuário criado com sucesso:', newUser);

        const accessToken = generateAccessToken(newUser._id);
        const refreshToken = generateRefreshToken(newUser._id);

        await Token.create({token: refreshToken, userId: newUser._id });
        
        logger.info('Atualizar token criado para o usuário',{
            userId: newUser._id,
            token: refreshToken
        })

        res.cookie('refreshToken', refreshToken,{
            httpOnly: true,
            secure: Config.node_env ==='production',
            sameSite: 'strict'
        })

        res.status(201).json({
           user:{
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                firstName: newUser.firstName,
                lastName: newUser.lastName
           },
           accessToken
        });
        
        logger.info('Usuário registrado com sucesso',{
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            firstName: newUser.firstName,
            lastName: newUser.lastName
        });
    }catch(err: any) { 
    
        console.error('Erro detalhado no registo:', err);
        
        // Melhorar o logging do erro
        logger.error('Erro durante o registo do utilizador', { 
            error: err.message,
            stack: err.stack,
            name: err.name
        });

        // Verificar se é erro de validação do Mongoose
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map((error: any) => error.message);
            res.status(400).json({
                code: 'ValidationError',
                message: 'Erro de validação',
                errors: errors
            });
            return;
        }

        // Verificar se é erro de duplicação
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            res.status(409).json({
                code: 'DuplicateField',
                message: `${field} já está em uso`
            });
            return;
        }

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}

export default Register;