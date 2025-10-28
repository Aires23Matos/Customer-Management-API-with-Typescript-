import { logger } from "@/lib/winston"
import Address from "@/models/address"
import Client from "@/models/client"
import type { Response, Request } from "express"

const getAddressById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;
    const { address_id } = req.params;

    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        if (!address_id) {
            res.status(400).json({
                code: 'MissingAddressId',
                message: 'ID do endereço é obrigatório'
            });
            return;
        }

        // Buscar endereço
        const address = await Address.findById(address_id).select('-__v');
        
        if (!address) {
            res.status(404).json({
                code: 'AddressNotFound',
                message: 'Endereço não encontrado'
            });
            return;
        }

        // Buscar informações do cliente
        const client = await Client.findOne({ client_id: address.client_id })
            .select('client_id clientName nif');

        const addressWithClientInfo = {
            ...address.toObject(),
            cliente: client ? {
                client_id: client.client_id,
                clientName: client.clientName,
                nif: client.nif
            } : null
        };

        logger.info('Endereço obtido com sucesso', {
            userId,
            address_id,
            client_id: address.client_id
        });

        res.status(200).json({
            code: 'AddressRetrieved',
            message: 'Endereço obtido com sucesso',
            data: addressWithClientInfo
        });

    } catch (err) {
        logger.error('Erro durante a obtenção do endereço', {
            userId,
            address_id,
            error: err instanceof Error ? err.message : err
        });

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export default getAddressById;