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
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const updateLicenseDataById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { license_id } = req.params;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        if (!license_id) {
            res.status(400).json({
                code: 'MissingLicenseId',
                message: 'ID da licença é obrigatório'
            });
            return;
        }
        const existingLicense = yield licenseData_1.default.findById(license_id);
        if (!existingLicense) {
            res.status(404).json({
                code: 'LicenseNotFound',
                message: 'Licença não encontrada'
            });
            return;
        }
        const { tecnico, localizacao, numeroLicenca, data_da_instalacao, data_da_ativacao, data_da_expiracao, hora_de_formacao, validade_em_mes, conta_pago, valor_pago, valor_total, estado } = req.body;
        const updateData = {};
        const contaPagoAtual = existingLicense.conta_pago;
        const contaPagoNovo = conta_pago !== undefined ? conta_pago : contaPagoAtual;
        if (contaPagoAtual === 'Pago' && contaPagoNovo === 'Parcial') {
            if (valor_total === undefined || valor_total === null) {
                res.status(400).json({
                    code: 'MissingRequiredField',
                    message: 'Ao mudar de "Pago" para "Parcial", o campo "valor_total" é obrigatório'
                });
                return;
            }
            if (valor_total <= 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Valor total deve ser maior que zero para pagamento parcial'
                });
                return;
            }
            const valorPagoFinal = valor_pago !== undefined ? valor_pago : existingLicense.valor_pago;
            if (valorPagoFinal >= valor_total) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para pagamento parcial, o valor pago deve ser menor que o valor total'
                });
                return;
            }
            updateData.valor_total = valor_total;
        }
        if (contaPagoNovo === 'Parcial' && contaPagoAtual !== 'Parcial') {
            const valorTotalFinal = valor_total !== undefined ? valor_total : existingLicense.valor_total;
            if (!valorTotalFinal || valorTotalFinal <= 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Valor total é obrigatório e deve ser maior que zero para pagamento parcial'
                });
                return;
            }
            const valorPagoFinal = valor_pago !== undefined ? valor_pago : existingLicense.valor_pago;
            if (valorPagoFinal >= valorTotalFinal) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para pagamento parcial, o valor pago deve ser menor que o valor total'
                });
                return;
            }
            if (valor_total !== undefined) {
                updateData.valor_total = valor_total;
            }
        }
        if (tecnico !== undefined) {
            const sanitizedTecnico = purify.sanitize(tecnico.toString().trim());
            if (sanitizedTecnico.length < 2 || sanitizedTecnico.length > 100) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Nome do técnico deve ter entre 2 e 100 caracteres'
                });
                return;
            }
            updateData.tecnico = sanitizedTecnico;
        }
        if (localizacao !== undefined) {
            const sanitizedLocalizacao = purify.sanitize(localizacao.toString().trim());
            if (sanitizedLocalizacao.length < 2 || sanitizedLocalizacao.length > 100) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Nome do técnico deve ter entre 2 e 100 caracteres'
                });
                return;
            }
            updateData.localizacao = sanitizedLocalizacao;
        }
        if (numeroLicenca !== undefined) {
            const sanitizedNumeroLicenca = purify.sanitize(numeroLicenca.toString().trim().toUpperCase());
            if (sanitizedNumeroLicenca !== existingLicense.numeroLicenca) {
                const existingLicenseWithNumber = yield licenseData_1.default.findOne({
                    numeroLicenca: sanitizedNumeroLicenca,
                    _id: { $ne: license_id }
                });
                if (existingLicenseWithNumber) {
                    res.status(409).json({
                        code: 'DuplicateLicense',
                        message: 'Este número de licença já está registado noutra licença'
                    });
                    return;
                }
            }
            updateData.numeroLicenca = sanitizedNumeroLicenca;
        }
        if (hora_de_formacao !== undefined) {
            const sanitizedHora = purify.sanitize(hora_de_formacao.toString().trim());
            const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!horaRegex.test(sanitizedHora)) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Formato de hora inválido (HH:MM)'
                });
                return;
            }
            updateData.hora_de_formacao = sanitizedHora;
        }
        if (validade_em_mes !== undefined) {
            if (validade_em_mes < 1 || validade_em_mes > 120) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Validade deve ser entre 1 e 120 meses'
                });
                return;
            }
            updateData.validade_em_mes = validade_em_mes;
        }
        if (valor_pago !== undefined) {
            if (valor_pago < 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Valor pago não pode ser negativo'
                });
                return;
            }
            updateData.valor_pago = valor_pago;
        }
        if (valor_total !== undefined) {
            if (valor_total < 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Valor total não pode ser negativo'
                });
                return;
            }
            updateData.valor_total = valor_total;
        }
        if (conta_pago !== undefined) {
            const estadosPagamento = ['Pago', 'Não Pago', 'Pendente', 'Parcial'];
            if (!estadosPagamento.includes(conta_pago)) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Estado de pagamento deve ser: Pago, Não Pago, Pendente ou Parcial'
                });
                return;
            }
            updateData.conta_pago = conta_pago;
        }
        if (estado !== undefined) {
            const estadosValidos = ['ativa', 'expirada', 'suspensa', 'pendente'];
            if (!estadosValidos.includes(estado)) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Estado deve ser: ativa, expirada, suspensa ou pendente'
                });
                return;
            }
            updateData.estado = estado;
        }
        if (data_da_instalacao !== undefined || data_da_ativacao !== undefined || data_da_expiracao !== undefined) {
            const dataInstalacao = data_da_instalacao !== undefined
                ? new Date(data_da_instalacao)
                : existingLicense.data_da_instalacao;
            const dataAtivacao = data_da_ativacao !== undefined
                ? new Date(data_da_ativacao)
                : existingLicense.data_da_ativacao;
            const dataExpiracao = data_da_expiracao !== undefined
                ? new Date(data_da_expiracao)
                : existingLicense.data_da_expiracao;
            const normalizeDate = (date) => {
                return new Date(date.getFullYear(), date.getMonth(), date.getDate());
            };
            const instalacaoNormalizada = normalizeDate(dataInstalacao);
            const ativacaoNormalizada = normalizeDate(dataAtivacao);
            const expiracaoNormalizada = normalizeDate(dataExpiracao);
            const hojeNormalizado = normalizeDate(new Date());
            if (data_da_instalacao !== undefined) {
                if (instalacaoNormalizada > hojeNormalizado) {
                    res.status(400).json({
                        code: 'InvalidField',
                        message: 'Data de instalação não pode ser futura'
                    });
                    return;
                }
                updateData.data_da_instalacao = dataInstalacao;
            }
            if (data_da_ativacao !== undefined) {
                if (ativacaoNormalizada < instalacaoNormalizada) {
                    res.status(400).json({
                        code: 'InvalidField',
                        message: 'Data de ativação deve ser posterior ou igual à data de instalação'
                    });
                    return;
                }
                updateData.data_da_ativacao = dataAtivacao;
            }
            if (data_da_expiracao !== undefined) {
                if (expiracaoNormalizada <= ativacaoNormalizada) {
                    res.status(400).json({
                        code: 'InvalidField',
                        message: 'Data de expiração deve ser posterior à data de ativação'
                    });
                    return;
                }
                updateData.data_da_expiracao = dataExpiracao;
            }
            if ((data_da_instalacao !== undefined || data_da_ativacao !== undefined) &&
                !(data_da_instalacao !== undefined && data_da_ativacao !== undefined)) {
                const instalacaoFinal = data_da_instalacao !== undefined ? dataInstalacao : existingLicense.data_da_instalacao;
                const ativacaoFinal = data_da_ativacao !== undefined ? dataAtivacao : existingLicense.data_da_ativacao;
                if (normalizeDate(ativacaoFinal) < normalizeDate(instalacaoFinal)) {
                    res.status(400).json({
                        code: 'InvalidField',
                        message: 'Data de ativação deve ser posterior ou igual à data de instalação'
                    });
                    return;
                }
            }
            if ((data_da_ativacao !== undefined || data_da_expiracao !== undefined) &&
                !(data_da_ativacao !== undefined && data_da_expiracao !== undefined)) {
                const ativacaoFinal = data_da_ativacao !== undefined ? dataAtivacao : existingLicense.data_da_ativacao;
                const expiracaoFinal = data_da_expiracao !== undefined ? dataExpiracao : existingLicense.data_da_expiracao;
                if (normalizeDate(expiracaoFinal) <= normalizeDate(ativacaoFinal)) {
                    res.status(400).json({
                        code: 'InvalidField',
                        message: 'Data de expiração deve ser posterior à data de ativação'
                    });
                    return;
                }
            }
        }
        const contaPagoFinal = updateData.conta_pago !== undefined ? updateData.conta_pago : existingLicense.conta_pago;
        const valorPagoFinal = updateData.valor_pago !== undefined ? updateData.valor_pago : existingLicense.valor_pago;
        const valorTotalFinal = updateData.valor_total !== undefined ? updateData.valor_total : existingLicense.valor_total;
        if (contaPagoFinal === 'Pago' && valorPagoFinal <= 0) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Licença marcada como paga deve ter valor pago maior que 0'
            });
            return;
        }
        if (contaPagoFinal === 'Parcial') {
            if (!valorTotalFinal || valorTotalFinal <= 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para pagamento parcial, o valor total é obrigatório e deve ser maior que zero'
                });
                return;
            }
            if (valorPagoFinal <= 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Licença marcada como parcial deve ter valor pago maior que 0'
                });
                return;
            }
            if (valorPagoFinal >= valorTotalFinal) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para pagamento parcial, o valor pago deve ser menor que o valor total'
                });
                return;
            }
        }
        if (Object.keys(updateData).length === 0) {
            res.status(400).json({
                code: 'NoDataToUpdate',
                message: 'Nenhum dado fornecido para atualização'
            });
            return;
        }
        const licenseAtualizada = yield licenseData_1.default.findByIdAndUpdate(license_id, updateData, {
            new: true,
            runValidators: false,
            context: 'query'
        });
        if (!licenseAtualizada) {
            res.status(404).json({
                code: 'LicenseNotFound',
                message: 'Licença não encontrada após atualização'
            });
            return;
        }
        winston_1.logger.info('Licença atualizada com sucesso', {
            userId,
            license_id,
            client_id: existingLicense.client_id,
            updatedFields: Object.keys(updateData),
            paymentStatusChange: contaPagoAtual !== contaPagoNovo ? `${contaPagoAtual} → ${contaPagoNovo}` : null
        });
        res.status(200).json({
            code: 'LicenseUpdated',
            message: 'Licença atualizada com sucesso',
            data: licenseAtualizada
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a atualização da licença', {
            userId,
            license_id,
            error: err instanceof Error ? err.message : err
        });
        if (err instanceof Error && err.name === 'CastError') {
            res.status(400).json({
                code: 'InvalidLicenseId',
                message: 'ID da licença inválido'
            });
            return;
        }
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});
exports.default = updateLicenseDataById;
