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
const client_1 = __importDefault(require("@/models/client"));
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const createContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!client_id || !email || !telefone) {
            res.status(400).json({
                code: 'MISSING_FIELDS',
                message: 'client_id, email e telefone são obrigatórios'
            });
            return;
        }
        const clientExists = yield client_1.default.findOne({ client_id });
        if (!clientExists) {
            res.status(404).json({
                code: 'CLIENT_NOT_FOUND',
                message: 'Cliente não encontrado'
            });
            return;
        }
        const sanitizedWebSite = web_site ? purify.sanitize(web_site.toString().trim()) : undefined;
        const sanitizedEmail = purify.sanitize(email.toString().trim());
        const sanitizedTelefone = purify.sanitize(telefone.toString().trim());
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedEmail)) {
            res.status(400).json({
                code: 'INVALID_EMAIL',
                message: 'Formato de email inválido'
            });
            return;
        }
        const cleanedTelefone = sanitizedTelefone.replace(/\D/g, '');
        const telefoneRegex = /^\d{9,13}$/;
        if (!telefoneRegex.test(cleanedTelefone)) {
            res.status(400).json({
                code: 'INVALID_PHONE',
                message: 'Formato de telefone inválido (9-13 dígitos)'
            });
            return;
        }
        const existingEmail = yield contact_1.default.findOne({
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
        const novoContacto = yield contact_1.default.create({
            client_id,
            web_site: sanitizedWebSite,
            email: sanitizedEmail.toLowerCase(),
            telefone: cleanedTelefone,
            isPrincipal: Boolean(isPrincipal)
        });
        winston_1.logger.info('Contacto criado com sucesso', {
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
    }
    catch (err) {
        winston_1.logger.error('Erro durante a criação do contacto', {
            userId,
            error: err instanceof Error ? err.message : 'Erro desconhecido',
            stack: err instanceof Error ? err.stack : undefined
        });
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
});
exports.default = createContact;
