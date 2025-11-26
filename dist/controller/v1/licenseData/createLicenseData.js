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
const licenseData_1 = __importDefault(require("../../../models/licenseData"));
const client_1 = __importDefault(require("../../../models/client"));
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const createLicenseData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        const { client_id, tecnico, localizacao, numeroLicenca, data_da_instalacao, data_da_ativacao, data_da_expiracao, hora_de_formacao, validade_em_mes, conta_pago = 'Pendente', valor_pago = 0, valor_total = 0, estado = 'ativa' } = req.body;
        const requiredFields = [
            'client_id', 'tecnico', 'localizacao', 'numeroLicenca', 'data_da_instalacao',
            'data_da_ativacao', 'data_da_expiracao', 'hora_de_formacao', 'validade_em_mes'
        ];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            res.status(400).json({
                code: 'MissingFields',
                message: `Campos obrigatórios em falta: ${missingFields.join(', ')}`
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
            tecnico: purify.sanitize(tecnico.toString().trim()),
            localizacao: purify.sanitize(localizacao.toString().trim()),
            numeroLicenca: purify.sanitize(numeroLicenca.toString().trim().toUpperCase()),
            hora_de_formacao: purify.sanitize(hora_de_formacao.toString().trim())
        };
        if (sanitizedData.tecnico.length < 2 || sanitizedData.tecnico.length > 100) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Nome do técnico deve ter entre 2 e 100 caracteres'
            });
            return;
        }
        if (sanitizedData.localizacao.length < 2 || sanitizedData.localizacao.length > 100) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Localização deve ter entre 2 e 100 caracteres'
            });
            return;
        }
        const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!horaRegex.test(sanitizedData.hora_de_formacao)) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Formato de hora inválido (HH:MM)'
            });
            return;
        }
        if (validade_em_mes < 1 || validade_em_mes > 120) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Validade deve ser entre 1 e 120 meses'
            });
            return;
        }
        if (valor_pago < 0) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Valor pago não pode ser negativo'
            });
            return;
        }
        if (valor_total < 0) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Valor total não pode ser negativo'
            });
            return;
        }
        if (conta_pago === 'Parcial') {
            if (valor_total <= 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Valor total deve ser maior que zero para pagamento parcial'
                });
                return;
            }
            if (valor_pago > valor_total) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Valor pago não pode ser maior que o valor total'
                });
                return;
            }
            if (valor_pago === valor_total) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para pagamento parcial, o valor pago deve ser menor que o valor total. Se o valor pago for igual ao total, o status deve ser "Pago".'
                });
                return;
            }
            if (valor_pago <= 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para pagamento parcial, o valor pago deve ser maior que zero'
                });
                return;
            }
        }
        if (conta_pago === 'Pago') {
            if (valor_total > 0 && valor_pago !== valor_total) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para status "Pago", o valor pago deve ser igual ao valor total'
                });
                return;
            }
            if (valor_total === 0 && valor_pago > 0) {
                if (valor_pago <= 0) {
                    res.status(400).json({
                        code: 'InvalidField',
                        message: 'Para status "Pago", o valor pago deve ser maior que zero'
                    });
                    return;
                }
            }
        }
        if (conta_pago === 'Não Pago') {
            if (valor_pago !== 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para status "Não Pago", o valor pago deve ser zero'
                });
                return;
            }
        }
        if (conta_pago === 'Pendente') {
        }
        const dataInstalacao = new Date(data_da_instalacao);
        const dataAtivacao = new Date(data_da_ativacao);
        const dataExpiracao = new Date(data_da_expiracao);
        if (dataInstalacao > new Date()) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Data de instalação não pode ser futura'
            });
            return;
        }
        if (dataAtivacao < dataInstalacao) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Data de ativação deve ser posterior ou igual à data de instalação'
            });
            return;
        }
        if (dataExpiracao <= dataAtivacao) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Data de expiração deve ser posterior à data de ativação'
            });
            return;
        }
        const existingLicense = yield licenseData_1.default.findOne({ numeroLicenca: sanitizedData.numeroLicenca });
        if (existingLicense) {
            res.status(409).json({
                code: 'DuplicateLicense',
                message: 'Este número de licença já está registado'
            });
            return;
        }
        let estadoFinal = estado;
        if (dataExpiracao < new Date() && estado === 'ativa') {
            estadoFinal = 'expirada';
        }
        let valorTotalFinal = valor_total;
        let valorPagoFinal = valor_pago;
        if (conta_pago === 'Pago' && valor_total === 0 && valor_pago > 0) {
            valorTotalFinal = valor_pago;
        }
        if (conta_pago === 'Pago' && valor_total > 0) {
            valorPagoFinal = valor_total;
        }
        const novaLicense = yield licenseData_1.default.create(Object.assign(Object.assign({ client_id }, sanitizedData), { data_da_instalacao: dataInstalacao, data_da_ativacao: dataAtivacao, data_da_expiracao: dataExpiracao, validade_em_mes,
            conta_pago, valor_pago: valorPagoFinal, valor_total: valorTotalFinal, estado: estadoFinal }));
        winston_1.logger.info('Licença criada com sucesso', {
            userId,
            client_id,
            license_id: novaLicense._id,
            numeroLicenca: sanitizedData.numeroLicenca,
            conta_pago,
            valor_pago: valorPagoFinal,
            valor_total: valorTotalFinal
        });
        res.status(201).json({
            code: 'LicenseCreated',
            message: 'Licença criada com sucesso',
            data: novaLicense
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a criação da licença', {
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
exports.default = createLicenseData;
