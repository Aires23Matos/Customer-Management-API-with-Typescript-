import { logger } from "@/lib/winston"
import Accountable from "@/models/accountable"
import type { Response, Request } from "express"

const deleteAccountableById = async (
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

        // Verificar se responsável existe
        const existingAccountable = await Accountable.findById(accountable_id);
        if (!existingAccountable) {
            res.status(404).json({
                code: 'AccountableNotFound',
                message: 'Responsável não encontrado'
            });
            return;
        }

        // Eliminar responsável
        await Accountable.findByIdAndDelete(accountable_id);

        logger.info('Responsável eliminado com sucesso', {
            userId,
            accountable_id,
            client_id: existingAccountable.client_id,
            nome: existingAccountable.nome
        });

        res.status(200).json({
            code: 'AccountableDeleted',
            message: 'Responsável eliminado com sucesso'
        });

    } catch (err) {
        logger.error('Erro durante a eliminação do responsável', {
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

export default deleteAccountableById;