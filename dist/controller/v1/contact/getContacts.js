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
const contact_1 = __importDefault(require("../../../models/contact"));
const client_1 = __importDefault(require("../../../models/client"));
const getContacts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'UNAUTHORIZED',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        const { page = 1, limit = 10, client_id, telefone, web_site, email, isPrincipal, search = '', sortBy = 'publishedAt', sortOrder = 'desc' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10)) || 1;
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))) || 10;
        const skip = (pageNum - 1) * limitNum;
        const query = {};
        if (client_id) {
            query.client_id = client_id.toString().trim();
        }
        if (telefone) {
            const cleanedTelefone = telefone.toString().replace(/\D/g, '');
            query.telefone = { $regex: cleanedTelefone, $options: 'i' };
        }
        if (email) {
            query.email = {
                $regex: email.toString().trim(),
                $options: 'i'
            };
        }
        if (web_site) {
            query.web_site = {
                $regex: web_site.toString().trim(),
                $options: 'i'
            };
        }
        if (typeof isPrincipal !== 'undefined') {
            if (isPrincipal === 'true') {
                query.isPrincipal = true;
            }
            else if (isPrincipal === 'false') {
                query.isPrincipal = false;
            }
        }
        if (search) {
            const searchTerm = search.toString().trim();
            const searchRegex = { $regex: searchTerm, $options: 'i' };
            query.$or = [
                { email: searchRegex },
                { telefone: searchRegex },
                { web_site: searchRegex },
                ...(searchTerm.startsWith('CLI') ? [{ client_id: searchRegex }] : [])
            ];
        }
        const sortOptions = {};
        const validSortFields = ['publishedAt', 'email', 'telefone', 'isPrincipal', 'createdAt', 'updatedAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'publishedAt';
        sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
        const [contacts, totalCount] = yield Promise.all([
            contact_1.default.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .select('-__v')
                .lean()
                .catch(error => {
                winston_1.logger.error('Erro ao buscar contactos', { error: error.message });
                throw new Error('Falha ao buscar contactos');
            }),
            contact_1.default.countDocuments(query)
                .catch(error => {
                winston_1.logger.error('Erro ao contar contactos', { error: error.message });
                throw new Error('Falha ao contar contactos');
            })
        ]);
        let clientMap = new Map();
        if (contacts.length > 0) {
            const clientIds = [...new Set(contacts.map(contact => contact.client_id))];
            const clients = yield client_1.default.find({
                _id: { $in: clientIds }
            })
                .select('clientName nif email _id')
                .lean()
                .catch(error => {
                winston_1.logger.warn('Erro ao buscar informações dos clientes', {
                    error: error.message,
                    clientIds
                });
                return [];
            });
            clientMap = new Map(clients.map(client => [client._id, {
                    client_id: client._id,
                    clientName: client.clientName,
                    nif: client.nif,
                }]));
        }
        const contactsWithClientInfo = contacts.map(contact => {
            const clientInfo = clientMap.get(contact.client_id) || null;
            return {
                id: contact._id,
                client_id: contact.client_id,
                web_site: contact.web_site || null,
                email: contact.email,
                telefone: contact.telefone,
                isPrincipal: contact.isPrincipal || false,
                publishedAt: contact.publishedAt,
                cliente: clientInfo
            };
        });
        const totalPages = Math.ceil(totalCount / limitNum);
        winston_1.logger.info('Lista de contactos obtida com sucesso', {
            userId,
            totalContacts: totalCount,
            page: pageNum,
            limit: limitNum,
            hasFilters: Object.keys(query).length > 0
        });
        res.status(200).json({
            code: 'CONTACTS_RETRIEVED',
            message: 'Contactos obtidos com sucesso',
            data: {
                contacts: contactsWithClientInfo,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCount,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1,
                    pageSize: limitNum
                },
                filters: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (client_id && { client_id })), (telefone && { telefone })), (email && { email })), (web_site && { web_site })), (isPrincipal !== undefined && { isPrincipal })), (search && { search })),
                sort: {
                    field: sortField,
                    order: sortOrder
                }
            }
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a obtenção dos contactos', {
            userId,
            error: err instanceof Error ? err.message : 'Erro desconhecido',
            stack: err instanceof Error ? err.stack : undefined
        });
        res.status(500).json(Object.assign({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' }, (process.env.NODE_ENV === 'development' && {
            error: err instanceof Error ? err.message : 'Erro desconhecido'
        })));
    }
});
exports.default = getContacts;
