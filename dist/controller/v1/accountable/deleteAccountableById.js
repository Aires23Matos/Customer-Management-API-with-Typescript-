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
const winston_1 = require("../../../lib/winston");
const accountable_1 = __importDefault(require("../../../models/accountable"));
const deleteAccountableById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existingAccountable = yield accountable_1.default.findById(accountable_id);
        if (!existingAccountable) {
            res.status(404).json({
                code: 'AccountableNotFound',
                message: 'Responsável não encontrado'
            });
            return;
        }
        yield accountable_1.default.findByIdAndDelete(accountable_id);
        winston_1.logger.info('Responsável eliminado com sucesso', {
            userId,
            accountable_id,
            client_id: existingAccountable.client_id,
            nome: existingAccountable.nome
        });
        res.status(200).json({
            code: 'AccountableDeleted',
            message: 'Responsável eliminado com sucesso'
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a eliminação do responsável', {
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
exports.default = deleteAccountableById;
