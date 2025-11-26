"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("@/lib/winston");
const accountable_1 = __importDefault(require("@/models/accountable"));
const client_1 = __importDefault(require("@/models/client"));
const getAccountables = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        const { page = 1, limit = 10, client_id, isPrincipal, search = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const query = {};
        if (client_id) {
            query.client_id = client_id;
        }
        if (typeof isPrincipal !== 'undefined') {
            query.isPrincipal = isPrincipal === 'true';
        }
        if (search) {
            query.$or = [
                { nome: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { telefone: { $regex: search, $options: 'i' } }
            ];
        }
        const [accountables, totalCount] = yield Promise.all([
            accountable_1.default.find(query)
                .sort({ publishedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .select('-__v'),
            accountable_1.default.countDocuments(query)
        ]);
        const clientIds = [...new Set(accountables.map(accountable => accountable.client_id))];
        const clients = yield client_1.default.find({ client_id: { $in: clientIds } })
            .select('client_id clientName nif');
        const accountablesWithClientInfo = accountables.map(accountable => {
            const client = clients.find(c => c.client_id === accountable.client_id);
            return Object.assign(Object.assign({}, accountable.toObject()), { cliente: client ? {
                    client_id: client.client_id,
                    clientName: client.clientName,
                    nif: client.nif
                } : null });
        });
        const totalPages = Math.ceil(totalCount / limitNum);
        winston_1.logger.info('Lista de responsáveis obtida com sucesso', {
            userId,
            totalAccountables: totalCount,
            page: pageNum,
            limit: limitNum
        });
        res.status(200).json({
            code: 'AccountablesRetrieved',
            message: 'Responsáveis obtidos com sucesso',
            data: {
                accountables: accountablesWithClientInfo,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCount,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                }
            }
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a obtenção dos responsáveis', {
            userId,
            error: err instanceof Error ? err.message : err
        });
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});
exports.default = getAccountables;
