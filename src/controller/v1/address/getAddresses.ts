import { logger } from "@/lib/winston"
import Address from "@/models/address"
import Client from "@/models/client"
import type { Response, Request } from "express"

const getAddresses = async (
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
            page = 1,
            limit = 10,
            client_id,
            provincia,
            municipio,
            bairro,
            search = ''
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Construir query
        const query: any = {};

        if (client_id) {
            query.client_id = client_id;
        }

        if (provincia) {
            query.provincia = { $regex: provincia, $options: 'i' };
        }

        if (municipio) {
            query.municipio = { $regex: municipio, $options: 'i' };
        }

        if (bairro) {
            query.bairro = { $regex: bairro, $options: 'i' };
        }

        if (search) {
            query.$or = [
                { provincia: { $regex: search, $options: 'i' } },
                { municipio: { $regex: search, $options: 'i' } },
                { bairro: { $regex: search, $options: 'i' } },
                { rua_ou_avenida: { $regex: search, $options: 'i' } }
            ];
        }

        // Buscar endereços com paginação
        const [addresses, totalCount] = await Promise.all([
            Address.find(query)
                .sort({ publishedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .select('-__v'),
            Address.countDocuments(query)
        ]);

        // Buscar informações dos clientes
        const clientIds = [...new Set(addresses.map(address => address.client_id))];
        const clients = await Client.find({ client_id: { $in: clientIds } })
            .select('client_id clientName nif');

        // Enriquecer endereços com dados do cliente
        const addressesWithClientInfo = addresses.map(address => {
            const client = clients.find(c => c.client_id === address.client_id);
            return {
                ...address.toObject(),
                cliente: client ? {
                    client_id: client.client_id,
                    clientName: client.clientName,
                    nif: client.nif
                } : null
            };
        });

        const totalPages = Math.ceil(totalCount / limitNum);

        logger.info('Lista de endereços obtida com sucesso', {
            userId,
            totalAddresses: totalCount,
            page: pageNum,
            limit: limitNum
        });

        res.status(200).json({
            code: 'AddressesRetrieved',
            message: 'Endereços obtidos com sucesso',
            data: {
                addresses: addressesWithClientInfo,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCount,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (err) {
        logger.error('Erro durante a obtenção dos endereços', {
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

export default getAddresses;