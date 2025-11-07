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

        // Criar licença
        const novaLicense = await LicenseData.create({
            client_id,
            ...sanitizedData,
            data_da_instalacao: dataInstalacao,
            data_da_ativacao: dataAtivacao,
            data_da_expiracao: dataExpiracao,
            validade_em_mes,
            conta_pago,
            valor_pago,
            estado
        });

        logger.info('Licença criada com sucesso', {
            userId,
            client_id,
            license_id: novaLicense._id,
            numeroLicenca: sanitizedData.numeroLicenca
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