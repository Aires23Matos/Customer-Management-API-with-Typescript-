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
const getAccountableById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { accountable_id } = req.params;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        if (!accountable_id) {
            res.status(400).json({
                code: 'MissingAccountableId',
                message: 'ID do responsável é obrigatório'
            });
            return;
        }
        const accountable = yield accountable_1.default.findById(accountable_id).select('-__v');
        if (!accountable) {
            res.status(404).json({
                code: 'AccountableNotFound',
                message: 'Responsável não encontrado'
            });
            return;
        }
        const client = yield client_1.default.findOne({ client_id: accountable.client_id })
            .select('client_id clientName nif');
        const accountableWithClientInfo = Object.assign(Object.assign({}, accountable.toObject()), { cliente: client ? {
                client_id: client.client_id,
                clientName: client.clientName,
                nif: client.nif
            } : null });
        winston_1.logger.info('Responsável obtido com sucesso', {
            userId,
            accountable_id,
            client_id: accountable.client_id
        });
        res.status(200).json({
            code: 'AccountableRetrieved',
            message: 'Responsável obtido com sucesso',
            data: accountableWithClientInfo
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a obtenção do responsável', {
            userId,
            accountable_id,
            error: err instanceof Error ? err.message : err
        });
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});
exports.default = getAccountableById;
