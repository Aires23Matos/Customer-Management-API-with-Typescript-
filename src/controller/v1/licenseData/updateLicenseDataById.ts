import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { logger } from "@/lib/winston"
import LicenseData from "@/models/licenseData"
import type { Response, Request } from "express"

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const updateLicenseDataById = async (
    req: Request,
    res: Response,
): Promise<void> => {
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

        // Verificar se licença existe
        const existingLicense = await LicenseData.findById(license_id);
        if (!existingLicense) {
            res.status(404).json({
                code: 'LicenseNotFound',
                message: 'Licença não encontrada'
            });
            return;
        }

        const {
            tecnico,
            localizacao,
            numeroLicenca,
            data_da_instalacao,
            data_da_ativacao,
            data_da_expiracao,
            hora_de_formacao,
            validade_em_mes,
            conta_pago,
            valor_pago,
            estado
        } = req.body;

        const updateData: any = {};

        // Atualizar campos se fornecidos
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
            
            // Verificar se novo número já existe noutra licença
            if (sanitizedNumeroLicenca !== existingLicense.numeroLicenca) {
                const existingLicenseWithNumber = await LicenseData.findOne({ 
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

        // VALIDAÇÃO CORRIGIDA DAS DATAS
        if (data_da_instalacao !== undefined || data_da_ativacao !== undefined || data_da_expiracao !== undefined) {
            // Usar valores existentes para campos não fornecidos
            const dataInstalacao = data_da_instalacao !== undefined 
                ? new Date(data_da_instalacao) 
                : existingLicense.data_da_instalacao;
            
            const dataAtivacao = data_da_ativacao !== undefined 
                ? new Date(data_da_ativacao) 
                : existingLicense.data_da_ativacao;
            
            const dataExpiracao = data_da_expiracao !== undefined 
                ? new Date(data_da_expiracao) 
                : existingLicense.data_da_expiracao;

            // Normalizar datas para comparar apenas a parte da data (ignorar horas)
            const normalizeDate = (date: Date) => {
                return new Date(date.getFullYear(), date.getMonth(), date.getDate());
            };

            const instalacaoNormalizada = normalizeDate(dataInstalacao);
            const ativacaoNormalizada = normalizeDate(dataAtivacao);
            const expiracaoNormalizada = normalizeDate(dataExpiracao);
            const hojeNormalizado = normalizeDate(new Date());

            // Validação de data de instalação
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

            // Validação de data de ativação
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

            // Validação de data de expiração
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

            // Validações cruzadas quando múltiplas datas são atualizadas
            if ((data_da_instalacao !== undefined || data_da_ativacao !== undefined) && 
                !(data_da_instalacao !== undefined && data_da_ativacao !== undefined)) {
                // Se apenas uma das duas (instalação ou ativação) foi atualizada
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
                // Se apenas uma das duas (ativação ou expiração) foi atualizada
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

        // Validar consistência do pagamento (CORRIGIDO)
        const contaPagoFinal = updateData.conta_pago !== undefined ? updateData.conta_pago : existingLicense.conta_pago;
        const valorPagoFinal = updateData.valor_pago !== undefined ? updateData.valor_pago : existingLicense.valor_pago;

        if (contaPagoFinal === 'Pago' && valorPagoFinal <= 0) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Licença marcada como paga deve ter valor pago maior que 0'
            });
            return;
        }

        if (contaPagoFinal === 'Parcial' && valorPagoFinal <= 0) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Licença marcada como parcial deve ter valor pago maior que 0'
            });
            return;
        }

        // Se não há dados para atualizar
        if (Object.keys(updateData).length === 0) {
            res.status(400).json({
                code: 'NoDataToUpdate',
                message: 'Nenhum dado fornecido para atualização'
            });
            return;
        }

        // Atualizar licença com opções que funcionam para atualizações parciais
        const licenseAtualizada = await LicenseData.findByIdAndUpdate(
            license_id,
            updateData,
            { 
                new: true, 
                runValidators: false, // Desativar validadores do Mongoose para evitar conflitos
                context: 'query'
            }
        );

        if (!licenseAtualizada) {
            res.status(404).json({
                code: 'LicenseNotFound',
                message: 'Licença não encontrada após atualização'
            });
            return;
        }

        logger.info('Licença atualizada com sucesso', {
            userId,
            license_id,
            client_id: existingLicense.client_id,
            updatedFields: Object.keys(updateData)
        });

        res.status(200).json({
            code: 'LicenseUpdated',
            message: 'Licença atualizada com sucesso',
            data: licenseAtualizada
        });

    } catch (err) {
        logger.error('Erro durante a atualização da licença', {
            userId,
            license_id,
            error: err instanceof Error ? err.message : err
        });

        // Tratamento específico para erros de cast
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
};

export default updateLicenseDataById;