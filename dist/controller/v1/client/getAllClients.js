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
const getAllClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        const { page = 1, limit = 10, search = '', sortBy = 'publishedAt', sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const searchQuery = {};
        if (search) {
            searchQuery.$or = [
                { clientName: { $regex: search, $options: 'i' } },
                { nif: { $regex: search, $options: 'i' } }
            ];
        }
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const [clients, totalCount] = yield Promise.all([
            client_1.default.find(searchQuery)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .select('-__v'),
            client_1.default.countDocuments(searchQuery)
        ]);
        const clientIds = clients.map(client => client.client_id);
        const [enderecos, contatos, licencas, responsaveis] = yield Promise.all([
            address_1.default.find({ client_id: { $in: clientIds } }),
            contact_1.default.find({ client_id: { $in: clientIds } }),
            licenseData_1.default.find({ client_id: { $in: clientIds } }),
            accountable_1.default.find({ client_id: { $in: clientIds } })
        ]);
        const clientsWithRelations = clients.map(client => {
            const clientEnderecos = enderecos.filter(e => e.client_id === client.client_id);
            const clientContatos = contatos.filter(c => c.client_id === client.client_id);
            const clientLicencas = licencas.filter(l => l.client_id === client.client_id);
            const clientResponsaveis = responsaveis.filter(r => r.client_id === client.client_id);
            return Object.assign(Object.assign({}, client.toObject()), { address: clientEnderecos, contact: clientContatos, licenseData: clientLicencas, accountable: clientResponsaveis });
        });
        const totalPages = Math.ceil(totalCount / limitNum);
        winston_1.logger.info('Lista de clientes obtida com sucesso', {
            userId,
            totalClients: totalCount,
            page: pageNum,
            limit: limitNum
        });
        res.status(200).json({
            code: 'ClientsRetrieved',
            message: 'Clientes obtidos com sucesso',
            data: {
                clients: clientsWithRelations,
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
        winston_1.logger.error('Erro durante a obtenção dos clientes', {
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
exports.default = getAllClients;
