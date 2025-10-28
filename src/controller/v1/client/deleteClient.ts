import { logger } from "@/lib/winston"
import Client from "@/models/client"
import Address from "@/models/address"
import Contact from "@/models/contact"
import LicenseData from "@/models/licenseData"
import Accountable from "@/models/accountable"
import type { Response, Request } from "express"


const deleteClient = async (
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

        // Verificar se cliente existe
        const existingClient = await Client.findOne({ client_id });
        if (!existingClient) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }

        // Eliminar todos os dados relacionados
        await Promise.all([
            Client.deleteOne({ client_id }),
            Address.deleteMany({ client_id }),
            Contact.deleteMany({ client_id }),
            LicenseData.deleteMany({ client_id }),
            Accountable.deleteMany({ client_id })
        ]);

        logger.info('Cliente eliminado com sucesso', {
            userId,
            client_id,
            clientName: existingClient.clientName
        });

        res.status(200).json({
            code: 'ClientDeleted',
            message: 'Cliente e todos os dados relacionados foram eliminados com sucesso'
        });

    } catch (err) {
        logger.error('Erro durante a eliminação do cliente', {
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

export default deleteClient;