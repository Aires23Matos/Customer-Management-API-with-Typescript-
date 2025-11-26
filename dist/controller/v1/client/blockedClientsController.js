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
exports.checkClientBlockStatus = exports.getBlockedClients = exports.unblockClient = exports.blockClient = void 0;
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const winston_1 = require("@/lib/winston");
const client_1 = __importDefault(require("@/models/client"));
const address_1 = __importDefault(require("@/models/address"));
const licenseData_1 = __importDefault(require("@/models/licenseData"));
const accountable_1 = __importDefault(require("@/models/accountable"));
const contact_1 = __importDefault(require("@/models/contact"));
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const blockClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        const { clientId, motivo } = req.body;
        if (!clientId) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'ID do cliente é obrigatório'
            });
            return;
        }
        const sanitizedClientId = purify.sanitize(clientId.toString().trim());
        const sanitizedMotivo = motivo ? purify.sanitize(motivo.toString().trim()) : '';
        if (sanitizedMotivo.length > 500) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'O motivo do bloqueio deve ter menos de 500 caracteres'
            });
            return;
        }
        const existingClient = yield client_1.default.findOne({ client_id: sanitizedClientId });
        if (!existingClient) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }
        if (existingClient.isBlocked) {
            res.status(409).json({
                code: 'ClientAlreadyBlocked',
                message: 'Cliente já está bloqueado'
            });
            return;
        }
        const updatedClient = yield client_1.default.findOneAndUpdate({ client_id: sanitizedClientId }, {
            isBlocked: true,
            blockedAt: new Date(),
            blockedBy: userId,
            blockReason: sanitizedMotivo
        }, { new: true });
        winston_1.logger.info('Cliente bloqueado com sucesso', {
            userId,
            clientId: sanitizedClientId,
            motivo: sanitizedMotivo
        });
        res.status(200).json({
            code: 'ClientBlocked',
            message: 'Cliente bloqueado com sucesso',
            data: {
                cliente: updatedClient
            }
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante o bloqueio do cliente', {
            userId,
            error: err instanceof Error ? err.message : err,
            stack: err instanceof Error ? err.stack : undefined
        });
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});
exports.blockClient = blockClient;
const unblockClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        const { clientId } = req.body;
        if (!clientId) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'ID do cliente é obrigatório'
            });
            return;
        }
        const sanitizedClientId = purify.sanitize(clientId.toString().trim());
        const existingClient = yield client_1.default.findOne({ client_id: sanitizedClientId });
        if (!existingClient) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }
        if (!existingClient.isBlocked) {
            res.status(409).json({
                code: 'ClientNotBlocked',
                message: 'Cliente não está bloqueado'
            });
            return;
        }
        const updatedClient = yield client_1.default.findOneAndUpdate({ client_id: sanitizedClientId }, {
            isBlocked: false,
            unblockedAt: new Date(),
            unblockedBy: userId,
            blockReason: null
        }, { new: true });
        winston_1.logger.info('Cliente desbloqueado com sucesso', {
            userId,
            clientId: sanitizedClientId
        });
        res.status(200).json({
            code: 'ClientUnblocked',
            message: 'Cliente desbloqueado com sucesso',
            data: {
                cliente: updatedClient
            }
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante o desbloqueio do cliente', {
            userId,
            error: err instanceof Error ? err.message : err,
            stack: err instanceof Error ? err.stack : undefined
        });
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});
exports.unblockClient = unblockClient;
const getBlockedClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        const blockedClients = yield client_1.default.find({ isBlocked: true });
        const blockedClientsWithDetails = yield Promise.all(blockedClients.map((client) => __awaiter(void 0, void 0, void 0, function* () {
            const [enderecos, contatos, licencas, responsaveis] = yield Promise.all([
                address_1.default.find({ client_id: client.client_id }),
                contact_1.default.find({ client_id: client.client_id }),
                licenseData_1.default.find({ client_id: client.client_id }),
                accountable_1.default.find({ client_id: client.client_id })
            ]);
            return {
                cliente: client,
                enderecos,
                contatos,
                licencas,
                responsaveis
            };
        })));
        winston_1.logger.info('Lista de clientes bloqueados consultada', {
            userId,
            totalBlocked: blockedClients.length
        });
        res.status(200).json({
            code: 'BlockedClientsRetrieved',
            message: 'Clientes bloqueados recuperados com sucesso',
            data: {
                total: blockedClients.length,
                clientes: blockedClientsWithDetails
            }
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a consulta de clientes bloqueados', {
            userId,
            error: err instanceof Error ? err.message : err,
            stack: err instanceof Error ? err.stack : undefined
        });
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});
exports.getBlockedClients = getBlockedClients;
const checkClientBlockStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        const { clientId } = req.params;
        if (!clientId) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'ID do cliente é obrigatório'
            });
            return;
        }
        const sanitizedClientId = purify.sanitize(clientId.toString().trim());
        const client = yield client_1.default.findOne({ client_id: sanitizedClientId });
        if (!client) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }
        res.status(200).json({
            code: 'ClientStatusRetrieved',
            message: 'Status do cliente recuperado com sucesso',
            data: {
                clientId: sanitizedClientId,
                clientName: client.clientName,
                isBlocked: client.isBlocked,
                blockedAt: client.blockedAt,
                blockedBy: client.blockedBy,
                blockReason: client.blockReason
            }
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a verificação do status do cliente', {
            userId,
            error: err instanceof Error ? err.message : err,
            stack: err instanceof Error ? err.stack : undefined
        });
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});
exports.checkClientBlockStatus = checkClientBlockStatus;
