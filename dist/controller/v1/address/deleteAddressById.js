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
const address_1 = __importDefault(require("@/models/address"));
const deleteAddressById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield address_1.default.findByIdAndDelete(address_id);
        winston_1.logger.info('Endereço eliminado com sucesso', {
            userId,
            address_id,
            client_id: existingAddress.client_id,
            municipio: existingAddress.municipio
        });
        res.status(200).json({
            code: 'AddressDeleted',
            message: 'Endereço eliminado com sucesso'
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a eliminação do endereço', {
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
exports.default = deleteAddressById;
