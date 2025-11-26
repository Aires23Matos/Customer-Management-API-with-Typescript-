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
const contact_1 = __importDefault(require("@/models/contact"));
const deleteContactById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { contact_id } = req.params;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'UNAUTHORIZED',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        if (!contact_id || contact_id.trim() === '') {
            res.status(400).json({
                code: 'MISSING_CONTACT_ID',
                message: 'ID do contacto é obrigatório'
            });
            return;
        }
        const trimmedContactId = contact_id.trim();
        const existingContact = yield contact_1.default.findById(trimmedContactId);
        if (!existingContact) {
            res.status(404).json({
                code: 'CONTACT_NOT_FOUND',
                message: 'Contacto não encontrado'
            });
            return;
        }
        const deleteResult = yield contact_1.default.findByIdAndDelete(trimmedContactId);
        if (!deleteResult) {
            winston_1.logger.warn('Tentativa de eliminar contacto já removido', {
                userId,
                contact_id: trimmedContactId
            });
            res.status(404).json({
                code: 'CONTACT_ALREADY_DELETED',
                message: 'Contacto já foi eliminado'
            });
            return;
        }
        winston_1.logger.info('Contacto eliminado com sucesso', {
            userId,
            contact_id: trimmedContactId,
            client_id: existingContact.client_id,
            email: existingContact.email,
            deletedAt: new Date().toISOString()
        });
        res.status(200).json({
            code: 'CONTACT_DELETED',
            message: 'Contacto eliminado com sucesso',
            data: {
                contact_id: trimmedContactId,
                client_id: existingContact.client_id,
                deleted_email: existingContact.email
            }
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a eliminação do contacto', {
            userId,
            contact_id: contact_id === null || contact_id === void 0 ? void 0 : contact_id.trim(),
            error: err instanceof Error ? err.message : 'Erro desconhecido',
            stack: err instanceof Error ? err.stack : undefined,
            timestamp: new Date().toISOString()
        });
        const errorResponse = {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro interno do servidor'
        };
        if (process.env.NODE_ENV === 'development') {
            errorResponse.error = err instanceof Error ? Object.assign({ name: err.name, message: err.message }, (err.stack && { stack: err.stack })) : err;
        }
        res.status(500).json(errorResponse);
    }
});
exports.default = deleteContactById;
