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
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const updateAddressById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { address_id } = req.params;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        if (!address_id) {
            res.status(400).json({
                code: 'MissingAddressId',
                message: 'ID do endereço é obrigatório'
            });
            return;
        }
        const existingAddress = yield address_1.default.findById(address_id);
        if (!existingAddress) {
            res.status(404).json({
                code: 'AddressNotFound',
                message: 'Endereço não encontrado'
            });
            return;
        }
        const { provincia, municipio, bairro, rua_ou_avenida, numero_da_casa, ponto_de_referencia } = req.body;
        const updateData = {};
        if (provincia) {
            const sanitizedProvincia = purify.sanitize(provincia.toString().trim());
            if (sanitizedProvincia.length > 10) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'A provincia deve ter menos de 10 caracteres'
                });
                return;
            }
            updateData.provincia = sanitizedProvincia;
        }
        if (municipio) {
            const sanitizedMunicipio = purify.sanitize(municipio.toString().trim());
            if (sanitizedMunicipio.length > 50) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'O municipio deve ter menos de 50 caracteres'
                });
                return;
            }
            updateData.municipio = sanitizedMunicipio;
        }
        if (bairro) {
            const sanitizedBairro = purify.sanitize(bairro.toString().trim());
            if (sanitizedBairro.length > 50) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'O bairro deve ter menos de 50 caracteres'
                });
                return;
            }
            updateData.bairro = sanitizedBairro;
        }
        if (rua_ou_avenida) {
            const sanitizedRua = purify.sanitize(rua_ou_avenida.toString().trim());
            if (sanitizedRua.length > 50) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'A rua ou avenida deve ter menos de 50 caracteres'
                });
                return;
            }
            updateData.rua_ou_avenida = sanitizedRua;
        }
        if (numero_da_casa) {
            const sanitizedNumero = purify.sanitize(numero_da_casa.toString().trim());
            if (sanitizedNumero.length > 50) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'O número da casa deve ter menos de 50 caracteres'
                });
                return;
            }
            updateData.numero_da_casa = sanitizedNumero;
        }
        if (ponto_de_referencia !== undefined) {
            updateData.ponto_de_referencia = purify.sanitize(ponto_de_referencia.toString().trim());
        }
        const enderecoAtualizado = yield address_1.default.findByIdAndUpdate(address_id, updateData, { new: true, runValidators: true });
        winston_1.logger.info('Endereço atualizado com sucesso', {
            userId,
            address_id,
            client_id: existingAddress.client_id
        });
        res.status(200).json({
            code: 'AddressUpdated',
            message: 'Endereço atualizado com sucesso',
            data: enderecoAtualizado
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a atualização do endereço', {
            userId,
            address_id,
            error: err instanceof Error ? err.message : err
        });
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});
exports.default = updateAddressById;
