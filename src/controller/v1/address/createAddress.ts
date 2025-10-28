import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { logger } from "@/lib/winston"
import Address from "@/models/address"
import Client from "@/models/client"
import type { Response, Request } from "express"

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const createAddress = async (
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
            provincia,
            municipio,
            bairro,
            rua_ou_avenida,
            numero_da_casa,
            ponto_de_referencia = ''
        } = req.body;

        // Validar campos obrigatórios
        if (!client_id || !provincia || !municipio || !bairro || !rua_ou_avenida || !numero_da_casa) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'client_id, provincia, municipio, bairro, rua_ou_avenida e numero_da_casa são obrigatórios'
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
            provincia: purify.sanitize(provincia.toString().trim()),
            municipio: purify.sanitize(municipio.toString().trim()),
            bairro: purify.sanitize(bairro.toString().trim()),
            rua_ou_avenida: purify.sanitize(rua_ou_avenida.toString().trim()),
            numero_da_casa: purify.sanitize(numero_da_casa.toString().trim()),
            ponto_de_referencia: purify.sanitize(ponto_de_referencia.toString().trim())
        };

        // Validar comprimentos máximos
        if (sanitizedData.provincia.length > 10) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'A provincia deve ter menos de 10 caracteres'
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

        // Criar endereço
        const novoEndereco = await Address.create({
            client_id,
            ...sanitizedData
        });

        logger.info('Endereço criado com sucesso', {
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

    } catch (err) {
        logger.error('Erro durante a criação do endereço', {
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

export default createAddress;