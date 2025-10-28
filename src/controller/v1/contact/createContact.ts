import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { logger } from "@/lib/winston"
import Contact from "@/models/contact"
import Client from "@/models/client"
import type { Response, Request } from "express"

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const createContact = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;

    try {
        if (!userId) {
            res.status(401).json({
                code: 'UNAUTHORIZED',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        const { client_id, web_site, email, telefone, isPrincipal = false } = req.body;

        // Validar campos obrigatórios
        if (!client_id || !email || !telefone) {
            res.status(400).json({
                code: 'MISSING_FIELDS',
                message: 'client_id, email e telefone são obrigatórios'
            });
            return;
        }

        // Verificar se cliente existe
        const clientExists = await Client.findOne({ client_id });
        if (!clientExists) {
            res.status(404).json({
                code: 'CLIENT_NOT_FOUND',
                message: 'Cliente não encontrado'
            });
            return;
        }

        // Sanitizar dados
        const sanitizedWebSite = web_site ? purify.sanitize(web_site.toString().trim()) : undefined;
        const sanitizedEmail = purify.sanitize(email.toString().trim());
        const sanitizedTelefone = purify.sanitize(telefone.toString().trim());

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedEmail)) {
            res.status(400).json({
                code: 'INVALID_EMAIL',
                message: 'Formato de email inválido'
            });
            return;
        }

        // Validar telefone (remover caracteres não numéricos antes de validar)
        const cleanedTelefone = sanitizedTelefone.replace(/\D/g, '');
        const telefoneRegex = /^\d{9,13}$/;
        if (!telefoneRegex.test(cleanedTelefone)) {
            res.status(400).json({
                code: 'INVALID_PHONE',
                message: 'Formato de telefone inválido (9-13 dígitos)'
            });
            return;
        }

        // Verificar se email já existe para este cliente
        const existingEmail = await Contact.findOne({ 
            client_id, 
            email: sanitizedEmail 
        });
        
        if (existingEmail) {
            res.status(409).json({
                code: 'EMAIL_ALREADY_EXISTS',
                message: 'Já existe um contacto com este email para este cliente'
            });
            return;
        }

        // Criar contacto
        const novoContacto = await Contact.create({
            client_id,
            web_site: sanitizedWebSite,
            email: sanitizedEmail.toLowerCase(),
            telefone: cleanedTelefone,
            isPrincipal: Boolean(isPrincipal)
        });

        logger.info('Contacto criado com sucesso', {
            userId,
            client_id,
            contacto_id: novoContacto._id,
            email: sanitizedEmail
        });

        res.status(201).json({
            code: 'CONTACT_CREATED',
            message: 'Contacto criado com sucesso',
            data: {
                id: novoContacto._id,
                client_id: novoContacto.client_id,
                web_site: novoContacto.web_site,
                email: novoContacto.email,
                telefone: novoContacto.telefone,
                isPrincipal: novoContacto.isPrincipal,
                publishedAt: novoContacto.publishedAt
            }
        });

    } catch (err) {
        logger.error('Erro durante a criação do contacto', {
            userId,
            error: err instanceof Error ? err.message : 'Erro desconhecido',
            stack: err instanceof Error ? err.stack : undefined
        });

        // Tratar erros do MongoDB
        if (err instanceof Error && 'code' in err && err.code === 11000) {
            res.status(409).json({
                code: 'DUPLICATE_CONTACT',
                message: 'Já existe um contacto com estes dados'
            });
            return;
        }

        res.status(500).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export default createContact;