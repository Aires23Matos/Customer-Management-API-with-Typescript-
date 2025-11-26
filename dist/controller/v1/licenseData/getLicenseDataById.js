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
const licenseData_1 = __importDefault(require("@/models/licenseData"));
const client_1 = __importDefault(require("@/models/client"));
const getLicenseDataById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { license_id } = req.params;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado',
            });
            return;
        }
        if (!license_id) {
            res.status(400).json({
                code: 'MissingLicenseId',
                message: 'ID da licença é obrigatório',
            });
            return;
        }
        const license = yield licenseData_1.default.findById(license_id).select('-__v');
        if (!license) {
            res.status(404).json({
                code: 'LicenseNotFound',
                message: 'Licença não encontrada',
            });
            return;
        }
        const client = yield client_1.default.findOne({
            client_id: license.client_id,
        }).select('client_id clientName nif');
        const licenseWithClientInfo = Object.assign(Object.assign({}, license.toObject()), { cliente: client
                ? {
                    client_id: client.client_id,
                    clientName: client.clientName,
                    nif: client.nif,
                }
                : null, dias_para_expirar: Math.ceil((license.data_da_expiracao.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)), esta_expirada: license.data_da_expiracao < new Date() });
        winston_1.logger.info('Licença obtida com sucesso', {
            userId,
            license_id,
            client_id: license.client_id,
        });
        res.status(200).json({
            code: 'LicenseRetrieved',
            message: 'Licença obtida com sucesso',
            data: licenseWithClientInfo,
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a obtenção da licença', {
            userId,
            license_id,
            error: err instanceof Error ? err.message : err,
        });
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined,
        });
    }
});
exports.default = getLicenseDataById;
