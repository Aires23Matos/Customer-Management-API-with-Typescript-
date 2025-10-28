import { logger } from "@/lib/winston"
import Client from "@/models/client"
import Address from "@/models/address"
import Contact from "@/models/contact"
import LicenseData from "@/models/licenseData"
import Accountable from "@/models/accountable"
import type { Response, Request } from "express"



const getClientById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;
    const { client_id } = req.params;

    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        if (!client_id) {
            res.status(400).json({
                code: 'MissingClientId',
                message: 'ID do cliente é obrigatório'
            });
            return;
        }

        // Buscar cliente e dados relacionados em paralelo
        const [cliente, enderecos, contatos, licencas, responsaveis] = await Promise.all([
            Client.findOne({ client_id }).select('-__v'),
            Address.find({ client_id }).select('-__v'),
            Contact.find({ client_id }).select('-__v'),
            LicenseData.find({ client_id }).select('-__v'),
            Accountable.find({ client_id }).select('-__v')
        ]);

        if (!cliente) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }

        const clientData = {
            ...cliente.toObject(),
            enderecos,
            contatos,
            licencas,
            responsaveis
        };

        logger.info('Cliente obtido com sucesso', {
            userId,
            client_id,
            clientName: cliente.clientName
        });

        res.status(200).json({
            code: 'ClientRetrieved',
            message: 'Cliente obtido com sucesso',
            data: clientData
        });

    } catch (err) {
        logger.error('Erro durante a obtenção do cliente', {
            userId,
            client_id,
            error: err instanceof Error ? err.message : err
        });

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export default getClientById;