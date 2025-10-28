import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { logger } from "@/lib/winston"
import Accountable from "@/models/accountable"
import type { Response, Request } from "express"

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const updateAccountableById = async (
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

        const { nome, email, telefone, isPrincipal } = req.body;
        const updateData: any = {};

        // Atualizar nome se fornecido
        if (nome) {
            const sanitizedNome = purify.sanitize(nome.toString().trim());
            if (sanitizedNome.length > 50) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'O nome deve ter menos de 50 caracteres'
                });
                return;
            }
            updateData.nome = sanitizedNome;
        }

        // Atualizar email se fornecido
        if (email) {
            const sanitizedEmail = purify.sanitize(email.toString().trim());
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!emailRegex.test(sanitizedEmail)) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Formato de email inválido'
                });
                return;
            }
            updateData.email = sanitizedEmail;
        }

        // Atualizar telefone se fornecido
        if (telefone) {
            const sanitizedTelefone = purify.sanitize(telefone.toString().trim());
            const telefoneRegex = /^\d{9,13}$/;
            
            if (!telefoneRegex.test(sanitizedTelefone.replace(/\s/g, ''))) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'Formato de telefone inválido (9-13 dígitos)'
                });
                return;
            }
            updateData.telefone = sanitizedTelefone;
        }

        // Atualizar isPrincipal se fornecido
        if (typeof isPrincipal !== 'undefined') {
            updateData.isPrincipal = Boolean(isPrincipal);

            // Se for marcado como principal, desmarcar outros
            if (updateData.isPrincipal) {
                await Accountable.updateMany(
                    { 
                        client_id: existingAccountable.client_id, 
                        _id: { $ne: accountable_id },
                        isPrincipal: true 
                    },
                    { isPrincipal: false }
                );
            }
        }

        // Atualizar responsável
        const accountableAtualizado = await Accountable.findByIdAndUpdate(
            accountable_id,
            updateData,
            { new: true, runValidators: true }
        );

        logger.info('Responsável atualizado com sucesso', {
            userId,
            accountable_id,
            client_id: existingAccountable.client_id
        });

        res.status(200).json({
            code: 'AccountableUpdated',
            message: 'Responsável atualizado com sucesso',
            data: accountableAtualizado
        });

    } catch (err) {
        logger.error('Erro durante a atualização do responsável', {
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

export default updateAccountableById;