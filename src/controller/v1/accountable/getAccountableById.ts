import { logger } from "@/lib/winston"
import Accountable from "@/models/accountable"
import Client from "@/models/client"
import type { Response, Request } from "express"

const getAccountableById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;
    const { accountable_id } = req.params;

    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        if (!accountable_id) {
            res.status(400).json({
                code: 'MissingAccountableId',
                message: 'ID do responsável é obrigatório'
            });
            return;
        }

        // Buscar responsável
        const accountable = await Accountable.findById(accountable_id).select('-__v');
        
        if (!accountable) {
            res.status(404).json({
                code: 'AccountableNotFound',
                message: 'Responsável não encontrado'
            });
            return;
        }

        // Buscar informações do cliente
        const client = await Client.findOne({ client_id: accountable.client_id })
            .select('client_id clientName nif');

        const accountableWithClientInfo = {
            ...accountable.toObject(),
            cliente: client ? {
                client_id: client.client_id,
                clientName: client.clientName,
                nif: client.nif
            } : null
        };

        logger.info('Responsável obtido com sucesso', {
            userId,
            accountable_id,
            client_id: accountable.client_id
        });

        res.status(200).json({
            code: 'AccountableRetrieved',
            message: 'Responsável obtido com sucesso',
            data: accountableWithClientInfo
        });

    } catch (err) {
        logger.error('Erro durante a obtenção do responsável', {
            userId,
            accountable_id,
            error: err instanceof Error ? err.message : err
        });

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export default getAccountableById;