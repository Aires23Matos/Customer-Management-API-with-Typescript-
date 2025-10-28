import { logger } from "@/lib/winston"
import Contact from "@/models/contact"
import Client from "@/models/client"
import type { Response, Request } from "express"

const getContactById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;
    const { contact_id } = req.params;

    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        if (!contact_id) {
            res.status(400).json({
                code: 'MissingContactId',
                message: 'ID do contacto é obrigatório'
            });
            return;
        }

        // Buscar contacto
        const contact = await Contact.findById(contact_id).select('-__v');
        
        if (!contact) {
            res.status(404).json({
                code: 'ContactNotFound',
                message: 'Contacto não encontrado'
            });
            return;
        }

        // Buscar informações do cliente
        const client = await Client.findOne({ client_id: contact.client_id })
            .select('client_id clientName nif');

        const contactWithClientInfo = {
            ...contact.toObject(),
            client: client ? {
                client_id: client.client_id,
                clientName: client.clientName,
                nif: client.nif
            } : null
        };

        logger.info('Contacto obtido com sucesso', {
            userId,
            contact_id,
            client_id: contact.client_id
        });

        res.status(200).json({
            code: 'ContactRetrieved',
            message: 'Contacto obtido com sucesso',
            data: contactWithClientInfo
        });

    } catch (err) {
        logger.error('Erro durante a obtenção do contacto', {
            userId,
            contact_id,
            error: err instanceof Error ? err.message : err
        });

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export default getContactById;