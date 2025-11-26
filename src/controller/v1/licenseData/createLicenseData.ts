import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { logger } from "@/lib/winston"
import LicenseData from "@/models/licenseData"
import Client from "@/models/client"
import type { Response, Request } from "express"

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const createLicenseData = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;

    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        const {
            client_id,
            tecnico,
            localizacao,
            numeroLicenca,
            data_da_instalacao,
            data_da_ativacao,
            data_da_expiracao,
            hora_de_formacao,
            validade_em_mes,
            conta_pago = 'Pendente',
            valor_pago = 0,
            valor_total = 0,
            estado = 'ativa'
        } = req.body;

        // Validar campos obrigatórios
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

        // Verificar se cliente existe
        const clientExists = await Client.findOne({ client_id });
        if (!clientExists) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }

        // Sanitizar dados
        const sanitizedData = {
            tecnico: purify.sanitize(tecnico.toString().trim()),
            localizacao:  purify.sanitize(localizacao.toString().trim()),
            numeroLicenca: purify.sanitize(numeroLicenca.toString().trim().toUpperCase()),
            hora_de_formacao: purify.sanitize(hora_de_formacao.toString().trim())
        };

        // Validar comprimentos
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

        // Validar formato da hora
        const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!horaRegex.test(sanitizedData.hora_de_formacao)) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Formato de hora inválido (HH:MM)'
            });
            return;
        }

        // Validar validade em meses
        if (validade_em_mes < 1 || validade_em_mes > 120) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Validade deve ser entre 1 e 120 meses'
            });
            return;
        }

        // Validar valor pago
        if (valor_pago < 0) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Valor pago não pode ser negativo'
            });
            return;
        }

        // Validar valor total
        if (valor_total < 0) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Valor total não pode ser negativo'
            });
            return;
        }

        // VALIDAÇÃO ESPECÍFICA PARA STATUS "Parcial"
        if (conta_pago === 'Parcial') {
            // Validar que valor_total é maior que zero
            if (valor_total <= 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Valor total deve ser maior que zero para pagamento parcial'
                });
                return;
            }

            // Validar que valor_pago não é maior que valor_total
            if (valor_pago > valor_total) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Valor pago não pode ser maior que o valor total'
                });
                return;
            }

            // Validar que valor_pago é menor que valor_total (não pode ser igual)
            if (valor_pago === valor_total) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para pagamento parcial, o valor pago deve ser menor que o valor total. Se o valor pago for igual ao total, o status deve ser "Pago".'
                });
                return;
            }

            // Validar que valor_pago é maior que zero para pagamento parcial
            if (valor_pago <= 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para pagamento parcial, o valor pago deve ser maior que zero'
                });
                return;
            }
        }

        // Validações para status "Pago"
        if (conta_pago === 'Pago') {
            // Se é pago, valor_pago deve ser igual a valor_total (se valor_total for definido)
            if (valor_total > 0 && valor_pago !== valor_total) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para status "Pago", o valor pago deve ser igual ao valor total'
                });
                return;
            }

            // Se valor_total não foi definido mas status é "Pago", definir valor_total igual a valor_pago
            if (valor_total === 0 && valor_pago > 0) {
                // Esta lógica será aplicada na criação do documento
                // Apenas validamos que se status é "Pago", então valor_pago deve ser > 0
                if (valor_pago <= 0) {
                    res.status(400).json({
                        code: 'InvalidField',
                        message: 'Para status "Pago", o valor pago deve ser maior que zero'
                    });
                    return;
                }
            }
        }

        // Validações para status "Não Pago"
        if (conta_pago === 'Não Pago') {
            // Se não é pago, valor_pago deve ser zero
            if (valor_pago !== 0) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Para status "Não Pago", o valor pago deve ser zero'
                });
                return;
            }
        }

        // Validações para status "Pendente"
        if (conta_pago === 'Pendente') {
            // Para pendente, podemos ter valor_pago > 0 mas não obrigatório
            // Apenas validamos que não seja negativo (já validado acima)
        }

        // Validar datas
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

        // Verificar se número de licença já existe
        const existingLicense = await LicenseData.findOne({ numeroLicenca: sanitizedData.numeroLicenca });
        if (existingLicense) {
            res.status(409).json({
                code: 'DuplicateLicense',
                message: 'Este número de licença já está registado'
            });
            return;
        }

        // Ajustar automaticamente o estado se a licença estiver expirada
        let estadoFinal = estado;
        if (dataExpiracao < new Date() && estado === 'ativa') {
            estadoFinal = 'expirada';
        }

        // Ajustar valor_total para status "Pago" se necessário
        let valorTotalFinal = valor_total;
        let valorPagoFinal = valor_pago;

        // Se status é "Pago" e valor_total é 0, definir valor_total igual a valor_pago
        if (conta_pago === 'Pago' && valor_total === 0 && valor_pago > 0) {
            valorTotalFinal = valor_pago;
        }

        // Se status é "Pago" e valor_total foi definido, garantir que valor_pago é igual
        if (conta_pago === 'Pago' && valor_total > 0) {
            valorPagoFinal = valor_total;
        }

        // Criar licença
        const novaLicense = await LicenseData.create({
            client_id,
            ...sanitizedData,
            data_da_instalacao: dataInstalacao,
            data_da_ativacao: dataAtivacao,
            data_da_expiracao: dataExpiracao,
            validade_em_mes,
            conta_pago,
            valor_pago: valorPagoFinal,
            valor_total: valorTotalFinal,
            estado: estadoFinal
        });

        logger.info('Licença criada com sucesso', {
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

    } catch (err) {
        logger.error('Erro durante a criação da licença', {
            userId,
            error: err instanceof Error ? err.message : err
        });

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export default createLicenseData;