import { logger } from "@/lib/winston"
import Contact from "@/models/contact"
import type { Response, Request } from "express"

const deleteContactById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;
    const { contact_id } = req.params;

    try {
        // ✅ VALIDAÇÃO MELHORADA: Verificar autenticação
        if (!userId) {
            res.status(401).json({
                code: 'UNAUTHORIZED',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        // ✅ VALIDAÇÃO MELHORADA: Verificar ID do contacto
        if (!contact_id || contact_id.trim() === '') {
            res.status(400).json({
                code: 'MISSING_CONTACT_ID',
                message: 'ID do contacto é obrigatório'
            });
            return;
        }

        const trimmedContactId = contact_id.trim();

        //  VERIFICAÇÃO DE EXISTÊNCIA COM TRATAMENTO DE ERRO
       
        
         const existingContact = await Contact.findById(trimmedContactId);
      

        if (!existingContact) {
            res.status(404).json({
                code: 'CONTACT_NOT_FOUND',
                message: 'Contacto não encontrado'
            });
            return;
        }

        // ELIMINAÇÃO COM VERIFICAÇÃO
        const deleteResult = await Contact.findByIdAndDelete(trimmedContactId);

        if (!deleteResult) {
            logger.warn('Tentativa de eliminar contacto já removido', {
                userId,
                contact_id: trimmedContactId
            });

            res.status(404).json({
                code: 'CONTACT_ALREADY_DELETED',
                message: 'Contacto já foi eliminado'
            });
            return;
        }

        // ✅ LOG MAIS INFORMATIVO
        logger.info('Contacto eliminado com sucesso', {
            userId,
            contact_id: trimmedContactId,
            client_id: existingContact.client_id,
            email: existingContact.email,
            deletedAt: new Date().toISOString()
        });

        // ✅ RESPOSTA PADRONIZADA
        res.status(200).json({
            code: 'CONTACT_DELETED',
            message: 'Contacto eliminado com sucesso',
            data: {
                contact_id: trimmedContactId,
                client_id: existingContact.client_id,
                deleted_email: existingContact.email // Para referência
            }
        });

    } catch (err) {
        // ✅ LOG DE ERRO MAIS DETALHADO
        logger.error('Erro durante a eliminação do contacto', {
            userId,
            contact_id: contact_id?.trim(),
            error: err instanceof Error ? err.message : 'Erro desconhecido',
            stack: err instanceof Error ? err.stack : undefined,
            timestamp: new Date().toISOString()
        });

        // ✅ RESPOSTA DE ERRO PADRONIZADA
        const errorResponse: any = {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro interno do servidor'
        };

        // ✅ APENAS MOSTRAR DETALHES EM DESENVOLVIMENTO
        if (process.env.NODE_ENV === 'development') {
            errorResponse.error = err instanceof Error ? {
                name: err.name,
                message: err.message,
                ...(err.stack && { stack: err.stack })
            } : err;
        }

        res.status(500).json(errorResponse);
    }
};

export default deleteContactById;