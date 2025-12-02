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
const address_1 = __importDefault(require("../../../models/address"));
const client_1 = __importDefault(require("../../../models/client"));
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const createAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        const { client_id, provincia, municipio, bairro, rua_ou_avenida, numero_da_casa, ponto_de_referencia = '' } = req.body;
        if (!client_id || !provincia || !municipio || !bairro || !rua_ou_avenida || !numero_da_casa) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'client_id, provincia, municipio, bairro, rua_ou_avenida e numero_da_casa são obrigatórios'
            });
            return;
        }
        const clientExists = yield client_1.default.findOne({ client_id });
        if (!clientExists) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }
        const sanitizedData = {
            provincia: purify.sanitize(provincia.toString().trim()),
            municipio: purify.sanitize(municipio.toString().trim()),
            bairro: purify.sanitize(bairro.toString().trim()),
            rua_ou_avenida: purify.sanitize(rua_ou_avenida.toString().trim()),
            numero_da_casa: purify.sanitize(numero_da_casa.toString().trim()),
            ponto_de_referencia: purify.sanitize(ponto_de_referencia.toString().trim())
        };
        if (sanitizedData.provincia.length > 50) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'A provincia deve ter menos de 50 caracteres'
            });
            return;
        }
        if (sanitizedData.municipio.length > 50) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'O municipio deve ter menos de 50 caracteres'
            });
            return;
        }
        if (sanitizedData.bairro.length > 50) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'O bairro deve ter menos de 50 caracteres'
            });
            return;
        }
        if (sanitizedData.rua_ou_avenida.length > 50) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'A rua ou avenida deve ter menos de 50 caracteres'
            });
            return;
        }
        if (sanitizedData.numero_da_casa.length > 50) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'O número da casa deve ter menos de 50 caracteres'
            });
            return;
        }
        const novoEndereco = yield address_1.default.create(Object.assign({ client_id }, sanitizedData));
        winston_1.logger.info('Endereço criado com sucesso', {
            userId,
            client_id,
            address_id: novoEndereco._id,
            provincia: sanitizedData.provincia,
            municipio: sanitizedData.municipio
        });
        res.status(201).json({
            code: 'AddressCreated',
            message: 'Endereço criado com sucesso',
            data: novoEndereco
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a criação do endereço', {
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
exports.default = createAddress;
