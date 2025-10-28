import { logger } from "@/lib/winston"
import Address from "@/models/address"
import type { Response, Request } from "express"

const deleteAddressById = async (
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

        // Verificar se endereço existe
        const existingAddress = await Address.findById(address_id);
        if (!existingAddress) {
            res.status(404).json({
                code: 'AddressNotFound',
                message: 'Endereço não encontrado'
            });
            return;
        }

        // Eliminar endereço
        await Address.findByIdAndDelete(address_id);

        logger.info('Endereço eliminado com sucesso', {
            userId,
            address_id,
            client_id: existingAddress.client_id,
            municipio: existingAddress.municipio
        });

        res.status(200).json({
            code: 'AddressDeleted',
            message: 'Endereço eliminado com sucesso'
        });

    } catch (err) {
        logger.error('Erro durante a eliminação do endereço', {
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

export default deleteAddressById;