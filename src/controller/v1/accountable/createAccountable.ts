import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { logger } from "@/lib/winston"
import Accountable from "@/models/accountable"
import Client from "@/models/client"
import type { Response, Request } from "express"

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const createAccountable = async (
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
            client_id,
            nome,
            email,
            telefone,
            isPrincipal = false
        } = req.body;

        // Validar campos obrigatórios
        if (!client_id || !nome || !email || !telefone) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'client_id, nome, email e telefone são obrigatórios'
            });
            return;
        }

        // Verificar se cliente existe
        const clientExists = await Client.findOne({ client_id });
        if (!clientExists) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }

        // Sanitizar dados
        const sanitizedData = {
            nome: purify.sanitize(nome.toString().trim()),
            email: purify.sanitize(email.toString().trim()),
            telefone: purify.sanitize(telefone.toString().trim())
        };

        // Validar comprimento do nome
        if (sanitizedData.nome.length > 50) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'O nome deve ter menos de 50 caracteres'
            });
            return;
        }

        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedData.email)) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Formato de email inválido'
            });
            return;
        }

        // Validar formato do telefone
        const telefoneRegex = /^\d{9,13}$/;
        if (!telefoneRegex.test(sanitizedData.telefone.replace(/\s/g, ''))) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Formato de telefone inválido (9-13 dígitos)'
            });
            return;
        }

        // Se for principal, desmarcar outros responsáveis principais
        if (isPrincipal) {
            await Accountable.updateMany(
                { client_id, isPrincipal: true },
                { isPrincipal: false }
            );
        }

        // Criar responsável
        const novoAccountable = await Accountable.create({
            client_id,
            ...sanitizedData,
            isPrincipal: Boolean(isPrincipal)
        });

        logger.info('Responsável criado com sucesso', {
            userId,
            client_id,
            accountable_id: novoAccountable._id,
            nome: sanitizedData.nome
        });

        res.status(201).json({
            code: 'AccountableCreated',
            message: 'Responsável criado com sucesso',
            data: novoAccountable
        });

    } catch (err) {
        logger.error('Erro durante a criação do responsável', {
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

export default createAccountable;