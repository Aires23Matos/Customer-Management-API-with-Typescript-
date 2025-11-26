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
const client_1 = __importDefault(require("../../../models/client"));
const address_1 = __importDefault(require("../../../models/address"));
const contact_1 = __importDefault(require("../../../models/contact"));
const licenseData_1 = __importDefault(require("../../../models/licenseData"));
const accountable_1 = __importDefault(require("../../../models/accountable"));
const deleteClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { client_id } = req.params;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        if (!client_id) {
            res.status(400).json({
                code: 'MissingClientId',
                message: 'ID do cliente é obrigatório'
            });
            return;
        }
        const existingClient = yield client_1.default.findOne({ client_id });
        if (!existingClient) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }
        yield Promise.all([
            client_1.default.deleteOne({ client_id }),
            address_1.default.deleteMany({ client_id }),
            contact_1.default.deleteMany({ client_id }),
            licenseData_1.default.deleteMany({ client_id }),
            accountable_1.default.deleteMany({ client_id })
        ]);
        winston_1.logger.info('Cliente eliminado com sucesso', {
            userId,
            client_id,
            clientName: existingClient.clientName
        });
        res.status(200).json({
            code: 'ClientDeleted',
            message: 'Cliente e todos os dados relacionados foram eliminados com sucesso'
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a eliminação do cliente', {
            userId,
            client_id,
            error: err instanceof Error ? err.message : err
        });
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});
exports.default = deleteClient;
