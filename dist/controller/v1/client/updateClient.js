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
const winston_1 = require("@/lib/winston");
const client_1 = __importDefault(require("@/models/client"));
const address_1 = __importDefault(require("@/models/address"));
const contact_1 = __importDefault(require("@/models/contact"));
const licenseData_1 = __importDefault(require("@/models/licenseData"));
const accountable_1 = __importDefault(require("@/models/accountable"));
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const updateClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { clientName, nif, enderecos = [], contatos = [], licencas = [], responsaveis = [] } = req.body;
        const updateData = {};
        if (clientName) {
            updateData.clientName = purify.sanitize(clientName.toString().trim());
            if (updateData.clientName.length > 20) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'O nome do cliente deve ter menos de 20 caracteres'
                });
                return;
            }
        }
        if (nif) {
            updateData.nif = purify.sanitize(nif.toString().trim());
            const nifRegex = /^(?:\d{9}|[A-Za-z0-9]{14})$/;
            if (!nifRegex.test(updateData.nif)) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'O NIF deve ter exatamente 9 dígitos numéricos OU 14 caracteres alfanuméricos'
                });
                return;
            }
            const nifExists = yield client_1.default.findOne({
                nif: updateData.nif,
                client_id: { $ne: client_id }
            });
            if (nifExists) {
                res.status(409).json({
                    code: 'DuplicateNIF',
                    message: 'Já existe outro cliente com este NIF'
                });
                return;
            }
        }
        if (Object.keys(updateData).length > 0) {
            yield client_1.default.updateOne({ client_id }, updateData);
        }
        if (Array.isArray(enderecos)) {
            yield address_1.default.deleteMany({ client_id });
            if (enderecos.length > 0) {
                const sanitizedEnderecos = enderecos.map((endereco) => {
                    var _a, _b, _c, _d;
                    return ({
                        client_id,
                        morada: purify.sanitize(((_a = endereco.morada) === null || _a === void 0 ? void 0 : _a.toString().trim()) || ''),
                        cidade: purify.sanitize(((_b = endereco.cidade) === null || _b === void 0 ? void 0 : _b.toString().trim()) || ''),
                        codigoPostal: purify.sanitize(((_c = endereco.codigoPostal) === null || _c === void 0 ? void 0 : _c.toString().trim()) || ''),
                        pais: purify.sanitize(((_d = endereco.pais) === null || _d === void 0 ? void 0 : _d.toString().trim()) || 'Portugal')
                    });
                });
                yield address_1.default.insertMany(sanitizedEnderecos);
            }
        }
        if (Array.isArray(contatos)) {
            yield contact_1.default.deleteMany({ client_id });
            if (contatos.length > 0) {
                const sanitizedContatos = contatos.map((contato) => {
                    var _a, _b;
                    return ({
                        client_id,
                        tipo: purify.sanitize(((_a = contato.tipo) === null || _a === void 0 ? void 0 : _a.toString().trim()) || 'email'),
                        valor: purify.sanitize(((_b = contato.valor) === null || _b === void 0 ? void 0 : _b.toString().trim()) || ''),
                        isPrincipal: Boolean(contato.isPrincipal)
                    });
                });
                yield contact_1.default.insertMany(sanitizedContatos);
            }
        }
        if (Array.isArray(licencas)) {
            yield licenseData_1.default.deleteMany({ client_id });
            if (licencas.length > 0) {
                const sanitizedLicencas = licencas.map((licenca) => {
                    var _a, _b, _c;
                    return ({
                        client_id,
                        tipoLicenca: purify.sanitize(((_a = licenca.tipoLicenca) === null || _a === void 0 ? void 0 : _a.toString().trim()) || ''),
                        numeroLicenca: purify.sanitize(((_b = licenca.numeroLicenca) === null || _b === void 0 ? void 0 : _b.toString().trim()) || ''),
                        dataEmissao: new Date(licenca.dataEmissao),
                        dataValidade: new Date(licenca.dataValidade),
                        estado: purify.sanitize(((_c = licenca.estado) === null || _c === void 0 ? void 0 : _c.toString().trim()) || 'ativa')
                    });
                });
                yield licenseData_1.default.insertMany(sanitizedLicencas);
            }
        }
        if (Array.isArray(responsaveis)) {
            yield accountable_1.default.deleteMany({ client_id });
            if (responsaveis.length > 0) {
                const sanitizedResponsaveis = responsaveis.map((responsavel) => {
                    var _a, _b, _c, _d;
                    return ({
                        client_id,
                        nome: purify.sanitize(((_a = responsavel.nome) === null || _a === void 0 ? void 0 : _a.toString().trim()) || ''),
                        cargo: purify.sanitize(((_b = responsavel.cargo) === null || _b === void 0 ? void 0 : _b.toString().trim()) || ''),
                        email: purify.sanitize(((_c = responsavel.email) === null || _c === void 0 ? void 0 : _c.toString().trim()) || ''),
                        telefone: purify.sanitize(((_d = responsavel.telefone) === null || _d === void 0 ? void 0 : _d.toString().trim()) || ''),
                        isPrincipal: Boolean(responsavel.isPrincipal)
                    });
                });
                yield accountable_1.default.insertMany(sanitizedResponsaveis);
            }
        }
        const clienteAtualizado = yield client_1.default.findOne({ client_id });
        const enderecosAtualizados = yield address_1.default.find({ client_id });
        const contatosAtualizados = yield contact_1.default.find({ client_id });
        const licencasAtualizadas = yield licenseData_1.default.find({ client_id });
        const responsaveisAtualizados = yield accountable_1.default.find({ client_id });
        winston_1.logger.info('Cliente atualizado com sucesso', {
            userId,
            client_id,
            clientName: clienteAtualizado === null || clienteAtualizado === void 0 ? void 0 : clienteAtualizado.clientName
        });
        res.status(200).json({
            code: 'ClientUpdated',
            message: 'Cliente atualizado com sucesso',
            data: {
                cliente: clienteAtualizado,
                enderecos: enderecosAtualizados,
                contatos: contatosAtualizados,
                licencas: licencasAtualizadas,
                responsaveis: responsaveisAtualizados
            }
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a atualização do cliente', {
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
exports.default = updateClient;
