import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { logger } from "@/lib/winston"
import Contact from "@/models/contact"
import type { Response, Request } from "express"

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const updateContactById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;
    const { contact_id } = req.params;

    try {
        if (!userId) {
            res.status(401).json({
                code: 'UNAUTHORIZED',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        if (!contact_id?.trim()) {
            res.status(400).json({
                code: 'MISSING_CONTACT_ID',
                message: 'ID do contacto é obrigatório'
            });
            return;
        }

        const contactId = contact_id.trim();

        const existingContact = await Contact.findById(contactId);
       
        if (!existingContact) {
            res.status(404).json({
                code: 'CONTACT_NOT_FOUND',
                message: 'Contacto não encontrado'
            });
            return;
        }

        const { web_site, email, telefone, isPrincipal } = req.body;
        
        //  VALIDAÇÃO MELHORADA: Verificar dados para atualização
        const hasUpdateData = web_site !== undefined || email !== undefined || 
                            telefone !== undefined || isPrincipal !== undefined;
        
        if (!hasUpdateData) {
            res.status(400).json({
                code: 'NO_DATA_TO_UPDATE',
                message: 'Nenhum dado fornecido para atualização'
            });
            return;
        }

        const updateData: any = {};
        const updatedFields: string[] = [];

        //  ATUALIZAR WEBSITE
        if (web_site !== undefined) {
            const sanitizedWebSite = web_site ? purify.sanitize(web_site.toString().trim()) : null;
            updateData.web_site = sanitizedWebSite;
            updatedFields.push('web_site');
        }

        // ATUALIZAR EMAIL
        if (email !== undefined) {
            if (!email || email.toString().trim() === '') {
                res.status(400).json({
                    code: 'INVALID_EMAIL',
                    message: 'Email não pode estar vazio'
                });
                return;
            }

            const sanitizedEmail = purify.sanitize(email.toString().trim().toLowerCase());
            
            // Validar formato do email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(sanitizedEmail)) {
                res.status(400).json({
                    code: 'INVALID_EMAIL',
                    message: 'Formato de email inválido'
                });
                return;
            }

            // Verificar duplicação apenas se email mudou
            if (sanitizedEmail !== existingContact.email) {
                const existingEmail = await Contact.findOne({
                    client_id: existingContact.client_id,
                    email: sanitizedEmail,
                    _id: { $ne: contactId }
                });

                if (existingEmail) {
                    res.status(409).json({
                        code: 'EMAIL_ALREADY_EXISTS',
                        message: 'Já existe outro contacto com este email para este cliente'
                    });
                    return;
                }
            }

            updateData.email = sanitizedEmail;
            updatedFields.push('email');
        }

        //  ATUALIZAR TELEFONE
        if (telefone !== undefined) {
            if (!telefone || telefone.toString().trim() === '') {
                res.status(400).json({
                    code: 'INVALID_PHONE',
                    message: 'Telefone não pode estar vazio'
                });
                return;
            }

            const sanitizedTelefone = purify.sanitize(telefone.toString().trim());
            
            // Validar e limpar telefone
            const cleanedTelefone = sanitizedTelefone.replace(/\D/g, '');
            const telefoneRegex = /^\d{9,13}$/;
            
            if (!telefoneRegex.test(cleanedTelefone)) {
                res.status(400).json({
                    code: 'INVALID_PHONE',
                    message: 'Formato de telefone inválido (9-13 dígitos)'
                });
                return;
            }

            updateData.telefone = cleanedTelefone;
            updatedFields.push('telefone');
        }

        //  ATUALIZAR IS_PRINCIPAL
        if (isPrincipal !== undefined) {
            const newIsPrincipal = Boolean(isPrincipal);
            updateData.isPrincipal = newIsPrincipal;
            updatedFields.push('isPrincipal');
            
            // Se está a tornar principal, desmarcar outros contactos principais
            if (newIsPrincipal && !existingContact.isPrincipal) {
                await Contact.updateMany(
                    { 
                        client_id: existingContact.client_id, 
                        _id: { $ne: contactId },
                        isPrincipal: true 
                    },
                    { isPrincipal: false }
                );
                
                logger.info('Outros contactos desmarcados como principal', {
                    userId,
                    client_id: existingContact.client_id,
                    contact_id: contactId
                });
            }
        }

        // VERIFICAR SE HÁ ALTERAÇÕES EFETIVAS
        if (updatedFields.length === 0) {
            res.status(400).json({
                code: 'NO_CHANGES_DETECTED',
                message: 'Nenhuma alteração válida fornecida'
            });
            return;
        }

        // ATUALIZAR CONTACTO
        const contactoAtualizado = await Contact.findByIdAndUpdate(
            contactId,
            updateData,
            { 
                new: true, 
                runValidators: true 
            }
        );

        if (!contactoAtualizado) {
            res.status(404).json({
                code: 'CONTACT_NOT_FOUND_AFTER_UPDATE',
                message: 'Contacto não encontrado após tentativa de atualização'
            });
            return;
        }

        // LOG DETALHADO
        logger.info('Contacto atualizado com sucesso', {
            userId,
            contact_id: contactId,
            client_id: existingContact.client_id,
            updated_fields: updatedFields,
            previous_values: {
                email: existingContact.email,
                telefone: existingContact.telefone,
                isPrincipal: existingContact.isPrincipal
            },
            new_values: {
                email: contactoAtualizado.email,
                telefone: contactoAtualizado.telefone,
                isPrincipal: contactoAtualizado.isPrincipal
            }
        });

        // RESPOSTA PADRONIZADA
        res.status(200).json({
            code: 'CONTACT_UPDATED',
            message: 'Contacto atualizado com sucesso',
            data: {
                id: contactoAtualizado._id,
                client_id: contactoAtualizado.client_id,
                web_site: contactoAtualizado.web_site,
                email: contactoAtualizado.email,
                telefone: contactoAtualizado.telefone,
                isPrincipal: contactoAtualizado.isPrincipal,
                publishedAt: contactoAtualizado.publishedAt,
            },
            metadata: {
                updated_fields: updatedFields
            }
        });

    } catch (err) {
        // LOG DE ERRO MAIS DETALHADO
        logger.error('Erro durante a atualização do contacto', {
            userId,
            contact_id: contact_id?.trim(),
            error: err instanceof Error ? err.message : 'Erro desconhecido',
            stack: err instanceof Error ? err.stack : undefined,
            body: req.body
        });

        // TRATAMENTO DE ERROS ESPECÍFICOS
        if (err instanceof Error) {
            // Erro de duplicação MongoDB
            if ('code' in err && err.code === 11000) {
                res.status(409).json({
                    code: 'DUPLICATE_CONTACT',
                    message: 'Já existe um contacto com estes dados'
                });
                return;
            }

            // Erro de validação do Mongoose
            if (err.name === 'ValidationError') {
                res.status(400).json({
                    code: 'VALIDATION_ERROR',
                    message: 'Dados de atualização inválidos',
                    ...(process.env.NODE_ENV === 'development' && { 
                        error: err.message 
                    })
                });
                return;
            }
        }

        //  ERRO GENÉRICO
        res.status(500).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro interno do servidor',
            ...(process.env.NODE_ENV === 'development' && { 
                error: err instanceof Error ? err.message : 'Erro desconhecido' 
            })
        });
    }
};

export default updateContactById;