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
        if (tecnico) {
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

        if (numeroLicenca) {
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

        if (hora_de_formacao) {
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

        if (validade_em_mes) {
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

        if (conta_pago) {
            const estadosPagamento = ['Pago', 'Não Pago', 'Pendente'];
            if (!estadosPagamento.includes(conta_pago)) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Estado de pagamento deve ser: Pago, Não Pago ou Pendente'
                });
                return;
            }
            updateData.conta_pago = conta_pago;
        }

        if (estado) {
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

        // Validar datas se fornecidas
        if (data_da_instalacao || data_da_ativacao || data_da_expiracao) {
            const dataInstalacao = data_da_instalacao ? new Date(data_da_instalacao) : existingLicense.data_da_instalacao;
            const dataAtivacao = data_da_ativacao ? new Date(data_da_ativacao) : existingLicense.data_da_ativacao;
            const dataExpiracao = data_da_expiracao ? new Date(data_da_expiracao) : existingLicense.data_da_expiracao;

            if (data_da_instalacao && dataInstalacao > new Date()) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Data de instalação não pode ser futura'
                });
                return;
            }

            if (data_da_ativacao && dataAtivacao < dataInstalacao) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Data de ativação deve ser posterior ou igual à data de instalação'
                });
                return;
            }

            if (data_da_expiracao && dataExpiracao <= dataAtivacao) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Data de expiração deve ser posterior à data de ativação'
                });
                return;
            }

            if (data_da_instalacao) updateData.data_da_instalacao = dataInstalacao;
            if (data_da_ativacao) updateData.data_da_ativacao = dataAtivacao;
            if (data_da_expiracao) updateData.data_da_expiracao = dataExpiracao;
        }

        // Validar consistência do pagamento
        if (updateData.conta_pago === 'Pago' && (updateData.valor_pago || existingLicense.valor_pago) <= 0) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Licença marcada como paga deve ter valor pago maior que 0'
            });
            return;
        }

        // Atualizar licença
        const licenseAtualizada = await LicenseData.findByIdAndUpdate(
            license_id,
            updateData,
            { new: true, runValidators: true }
        );

        logger.info('Licença atualizada com sucesso', {
            userId,
            license_id,
            client_id: existingLicense.client_id
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

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export default updateLicenseDataById;