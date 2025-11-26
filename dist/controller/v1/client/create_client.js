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
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const winston_1 = require("../../../lib/winston");
const client_1 = __importDefault(require("../../../models/client"));
const address_1 = __importDefault(require("../../../models/address"));
const licenseData_1 = __importDefault(require("../../../models/licenseData"));
const accountable_1 = __importDefault(require("../../../models/accountable"));
const contact_1 = __importDefault(require("../../../models/contact"));
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const createClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        const { clientName, nif, enderecos = [], contatos = [], licencas = [], responsaveis = [] } = req.body;
        if (!clientName || !nif) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'Nome do cliente e NIF são obrigatórios'
            });
            return;
        }
        const sanitizedClientName = purify.sanitize(clientName.toString().trim());
        const sanitizedNif = purify.sanitize(nif.toString().trim());
        if (sanitizedClientName.length > 20) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'O nome do cliente deve ter menos de 20 caracteres'
            });
            return;
        }
        const nifRegex = /^(?:\d{10}|[A-Za-z0-9]{14})$/;
        if (!nifRegex.test(sanitizedNif)) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'O NIF deve ter exatamente 10 dígitos numéricos OU 14 caracteres alfanuméricos'
            });
            return;
        }
        const existingClient = yield client_1.default.findOne({ nif: sanitizedNif });
        if (existingClient) {
            res.status(409).json({
                code: 'DuplicateNIF',
                message: 'Já existe um cliente com este NIF'
            });
            return;
        }
        const novoCliente = yield client_1.default.create({
            clientName: sanitizedClientName,
            nif: sanitizedNif
        });
        const clientId = novoCliente.client_id;
        if (enderecos.length > 0) {
            const sanitizedEnderecos = enderecos.map((endereco) => {
                var _a, _b, _c, _d;
                return ({
                    client_id: clientId,
                    morada: purify.sanitize(((_a = endereco.morada) === null || _a === void 0 ? void 0 : _a.toString().trim()) || ''),
                    cidade: purify.sanitize(((_b = endereco.cidade) === null || _b === void 0 ? void 0 : _b.toString().trim()) || ''),
                    codigoPostal: purify.sanitize(((_c = endereco.codigoPostal) === null || _c === void 0 ? void 0 : _c.toString().trim()) || ''),
                    pais: purify.sanitize(((_d = endereco.pais) === null || _d === void 0 ? void 0 : _d.toString().trim()) || 'Portugal')
                });
            });
            yield address_1.default.insertMany(sanitizedEnderecos);
        }
        if (contatos.length > 0) {
            const sanitizedContatos = contatos.map((contato) => {
                var _a, _b;
                return ({
                    client_id: clientId,
                    tipo: purify.sanitize(((_a = contato.tipo) === null || _a === void 0 ? void 0 : _a.toString().trim()) || 'email'),
                    valor: purify.sanitize(((_b = contato.valor) === null || _b === void 0 ? void 0 : _b.toString().trim()) || ''),
                    isPrincipal: Boolean(contato.isPrincipal)
                });
            });
            yield contact_1.default.insertMany(sanitizedContatos);
        }
        if (licencas.length > 0) {
            const sanitizedLicencas = licencas.map((licenca) => {
                var _a, _b, _c;
                return ({
                    client_id: clientId,
                    tipoLicenca: purify.sanitize(((_a = licenca.tipoLicenca) === null || _a === void 0 ? void 0 : _a.toString().trim()) || ''),
                    numeroLicenca: purify.sanitize(((_b = licenca.numeroLicenca) === null || _b === void 0 ? void 0 : _b.toString().trim()) || ''),
                    dataEmissao: new Date(licenca.dataEmissao),
                    dataValidade: new Date(licenca.dataValidade),
                    estado: purify.sanitize(((_c = licenca.estado) === null || _c === void 0 ? void 0 : _c.toString().trim()) || 'ativa')
                });
            });
            yield licenseData_1.default.insertMany(sanitizedLicencas);
        }
        if (responsaveis.length > 0) {
            const sanitizedResponsaveis = responsaveis.map((responsavel) => {
                var _a, _b, _c, _d;
                return ({
                    client_id: clientId,
                    nome: purify.sanitize(((_a = responsavel.nome) === null || _a === void 0 ? void 0 : _a.toString().trim()) || ''),
                    cargo: purify.sanitize(((_b = responsavel.cargo) === null || _b === void 0 ? void 0 : _b.toString().trim()) || ''),
                    email: purify.sanitize(((_c = responsavel.email) === null || _c === void 0 ? void 0 : _c.toString().trim()) || ''),
                    telefone: purify.sanitize(((_d = responsavel.telefone) === null || _d === void 0 ? void 0 : _d.toString().trim()) || ''),
                    isPrincipal: Boolean(responsavel.isPrincipal)
                });
            });
            yield accountable_1.default.insertMany(sanitizedResponsaveis);
        }
        const clienteCompleto = yield client_1.default.findOne({ client_id: clientId });
        const enderecosCliente = yield address_1.default.find({ client_id: clientId });
        const contatosCliente = yield contact_1.default.find({ client_id: clientId });
        const licencasCliente = yield licenseData_1.default.find({ client_id: clientId });
        const responsaveisCliente = yield accountable_1.default.find({ client_id: clientId });
        winston_1.logger.info('Cliente criado com sucesso', {
            userId,
            clientId,
            clientName: sanitizedClientName
        });
        res.status(201).json({
            code: 'ClientCreated',
            message: 'Cliente criado com sucesso',
            data: {
                cliente: clienteCompleto,
                enderecos: enderecosCliente,
                contatos: contatosCliente,
                licencas: licencasCliente,
                responsaveis: responsaveisCliente
            }
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a criação do cliente', {
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
exports.default = createClient;
