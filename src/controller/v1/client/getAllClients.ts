import { logger } from "@/lib/winston"
import Client from "@/models/client"
import Address from "@/models/address"
import Contact from "@/models/contact"
import LicenseData from "@/models/licenseData"
import Accountable from "@/models/accountable"
import type { Response, Request } from "express"


const getAllClients = async (
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
            search = '',
            sortBy = 'publishedAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Construir query de pesquisa
        const searchQuery: any = {};
        if (search) {
            searchQuery.$or = [
                { clientName: { $regex: search, $options: 'i' } },
                { nif: { $regex: search, $options: 'i' } }
            ];
        }

        // Ordenação
        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

        // Buscar clientes com paginação
        const [clients, totalCount] = await Promise.all([
            Client.find(searchQuery)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .select('-__v'),
            Client.countDocuments(searchQuery)
        ]);

        // Buscar dados relacionados para todos os clientes
        const clientIds = clients.map(client => client.client_id);

        const [enderecos, contatos, licencas, responsaveis] = await Promise.all([
            Address.find({ client_id: { $in: clientIds } }),
            Contact.find({ client_id: { $in: clientIds } }),
            LicenseData.find({ client_id: { $in: clientIds } }),
            Accountable.find({ client_id: { $in: clientIds } })
        ]);

        // Agrupar dados por client_id
        const clientsWithRelations = clients.map(client => {
            const clientEnderecos = enderecos.filter(e => e.client_id === client.client_id);
            const clientContatos = contatos.filter(c => c.client_id === client.client_id);
            const clientLicencas = licencas.filter(l => l.client_id === client.client_id);
            const clientResponsaveis = responsaveis.filter(r => r.client_id === client.client_id);

            return {
                ...client.toObject(),
                address: clientEnderecos,
                contact: clientContatos,
                licenseData: clientLicencas,
                accountable: clientResponsaveis
            };
        });

        const totalPages = Math.ceil(totalCount / limitNum);

        logger.info('Lista de clientes obtida com sucesso', {
            userId,
            totalClients: totalCount,
            page: pageNum,
            limit: limitNum
        });

        res.status(200).json({
            code: 'ClientsRetrieved',
            message: 'Clientes obtidos com sucesso',
            data: {
                clients: clientsWithRelations,
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
        logger.error('Erro durante a obtenção dos clientes', {
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

export default getAllClients;