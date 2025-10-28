import { logger } from "@/lib/winston"
import Accountable from "@/models/accountable"
import Client from "@/models/client"
import type { Response, Request } from "express"

const getAccountables = async (
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
            isPrincipal,
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

        if (typeof isPrincipal !== 'undefined') {
            query.isPrincipal = isPrincipal === 'true';
        }

        if (search) {
            query.$or = [
                { nome: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { telefone: { $regex: search, $options: 'i' } }
            ];
        }

        // Buscar responsáveis com paginação
        const [accountables, totalCount] = await Promise.all([
            Accountable.find(query)
                .sort({ publishedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .select('-__v'),
            Accountable.countDocuments(query)
        ]);

        // Buscar informações dos clientes
        const clientIds = [...new Set(accountables.map(accountable => accountable.client_id))];
        const clients = await Client.find({ client_id: { $in: clientIds } })
            .select('client_id clientName nif');

        // Enriquecer responsáveis com dados do cliente
        const accountablesWithClientInfo = accountables.map(accountable => {
            const client = clients.find(c => c.client_id === accountable.client_id);
            return {
                ...accountable.toObject(),
                cliente: client ? {
                    client_id: client.client_id,
                    clientName: client.clientName,
                    nif: client.nif
                } : null
            };
        });

        const totalPages = Math.ceil(totalCount / limitNum);

        logger.info('Lista de responsáveis obtida com sucesso', {
            userId,
            totalAccountables: totalCount,
            page: pageNum,
            limit: limitNum
        });

        res.status(200).json({
            code: 'AccountablesRetrieved',
            message: 'Responsáveis obtidos com sucesso',
            data: {
                accountables: accountablesWithClientInfo,
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
        logger.error('Erro durante a obtenção dos responsáveis', {
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

export default getAccountables;