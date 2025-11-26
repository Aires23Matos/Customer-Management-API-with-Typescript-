"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const winston_1 = require("@/lib/winston");
const contact_1 = __importDefault(require("@/models/contact"));
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const updateContactById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!(contact_id === null || contact_id === void 0 ? void 0 : contact_id.trim())) {
            res.status(400).json({
                code: 'MISSING_CONTACT_ID',
                message: 'ID do contacto é obrigatório'
            });
            return;
        }
        const contactId = contact_id.trim();
        const existingContact = yield contact_1.default.findById(contactId);
        if (!existingContact) {
            res.status(404).json({
                code: 'CONTACT_NOT_FOUND',
                message: 'Contacto não encontrado'
            });
            return;
        }
        const { web_site, email, telefone, isPrincipal } = req.body;
        const hasUpdateData = web_site !== undefined || email !== undefined ||
            telefone !== undefined || isPrincipal !== undefined;
        if (!hasUpdateData) {
            res.status(400).json({
                code: 'NO_DATA_TO_UPDATE',
                message: 'Nenhum dado fornecido para atualização'
            });
            return;
        }
        const updateData = {};
        const updatedFields = [];
        if (web_site !== undefined) {
            const sanitizedWebSite = web_site ? purify.sanitize(web_site.toString().trim()) : null;
            updateData.web_site = sanitizedWebSite;
            updatedFields.push('web_site');
        }
        if (email !== undefined) {
            if (!email || email.toString().trim() === '') {
                res.status(400).json({
                    code: 'INVALID_EMAIL',
                    message: 'Email não pode estar vazio'
                });
                return;
            }
            const sanitizedEmail = purify.sanitize(email.toString().trim().toLowerCase());
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(sanitizedEmail)) {
                res.status(400).json({
                    code: 'INVALID_EMAIL',
                    message: 'Formato de email inválido'
                });
                return;
            }
            if (sanitizedEmail !== existingContact.email) {
                const existingEmail = yield contact_1.default.findOne({
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
        if (telefone !== undefined) {
            if (!telefone || telefone.toString().trim() === '') {
                res.status(400).json({
                    code: 'INVALID_PHONE',
                    message: 'Telefone não pode estar vazio'
                });
                return;
            }
            const sanitizedTelefone = purify.sanitize(telefone.toString().trim());
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
        if (isPrincipal !== undefined) {
            const newIsPrincipal = Boolean(isPrincipal);
            updateData.isPrincipal = newIsPrincipal;
            updatedFields.push('isPrincipal');
            if (newIsPrincipal && !existingContact.isPrincipal) {
                yield contact_1.default.updateMany({
                    client_id: existingContact.client_id,
                    _id: { $ne: contactId },
                    isPrincipal: true
                }, { isPrincipal: false });
                winston_1.logger.info('Outros contactos desmarcados como principal', {
                    userId,
                    client_id: existingContact.client_id,
                    contact_id: contactId
                });
            }
        }
        if (updatedFields.length === 0) {
            res.status(400).json({
                code: 'NO_CHANGES_DETECTED',
                message: 'Nenhuma alteração válida fornecida'
            });
            return;
        }
        const contactoAtualizado = yield contact_1.default.findByIdAndUpdate(contactId, updateData, {
            new: true,
            runValidators: true
        });
        if (!contactoAtualizado) {
            res.status(404).json({
                code: 'CONTACT_NOT_FOUND_AFTER_UPDATE',
                message: 'Contacto não encontrado após tentativa de atualização'
            });
            return;
        }
        winston_1.logger.info('Contacto atualizado com sucesso', {
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
    }
    catch (err) {
        winston_1.logger.error('Erro durante a atualização do contacto', {
            userId,
            contact_id: contact_id === null || contact_id === void 0 ? void 0 : contact_id.trim(),
            error: err instanceof Error ? err.message : 'Erro desconhecido',
            stack: err instanceof Error ? err.stack : undefined,
            body: req.body
        });
        if (err instanceof Error) {
            if ('code' in err && err.code === 11000) {
                res.status(409).json({
                    code: 'DUPLICATE_CONTACT',
                    message: 'Já existe um contacto com estes dados'
                });
                return;
            }
            if (err.name === 'ValidationError') {
                res.status(400).json(Object.assign({ code: 'VALIDATION_ERROR', message: 'Dados de atualização inválidos' }, (process.env.NODE_ENV === 'development' && {
                    error: err.message
                })));
                return;
            }
        }
        res.status(500).json(Object.assign({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' }, (process.env.NODE_ENV === 'development' && {
            error: err instanceof Error ? err.message : 'Erro desconhecido'
        })));
    }
});
exports.default = updateContactById;
