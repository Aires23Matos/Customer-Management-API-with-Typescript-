"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const jwt_1 = require("../lib/jwt");
const winston_1 = require("../lib/winston");
const authentication = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer'))) {
        res.status(401).json({
            code: 'AuthenticationError',
            message: 'Acesso negado, nenhum token fornecido',
        });
        return;
    }
    const [_, token] = authHeader.split(' ');
    try {
        const jwtPayload = (0, jwt_1.verifyAccessToken)(token);
        req.userId = jwtPayload.userId;
        return next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.TokenExpiredError) {
            res.status(401).json({
                code: 'AuthenticationError',
                message: 'Tempo de acesso expirado, solicite um novo com token de atualização',
            });
            return;
        }
        if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
            res.status(401).json({
                code: 'AuthenticationError',
                message: 'Dado de acesso inválido'
            });
            return;
        }
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: err
        });
        winston_1.logger.error('Erro durante a autenticação', err);
    }
};
exports.default = authentication;
