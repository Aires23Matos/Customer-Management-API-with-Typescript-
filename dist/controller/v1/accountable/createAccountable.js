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
const winston_1 = require("../../../lib/winston");
const accountable_1 = __importDefault(require("../../../models/accountable"));
const client_1 = __importDefault(require("../../../models/client"));
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const createAccountable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }
        const { client_id, nome, email, telefone, isPrincipal = false } = req.body;
        if (!client_id || !nome || !email || !telefone) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'client_id, nome, email e telefone são obrigatórios'
            });
            return;
        }
        const clientExists = yield client_1.default.findOne({ client_id });
        if (!clientExists) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }
        const sanitizedData = {
            nome: purify.sanitize(nome.toString().trim()),
            email: purify.sanitize(email.toString().trim()),
            telefone: purify.sanitize(telefone.toString().trim())
        };
        if (sanitizedData.nome.length > 50) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'O nome deve ter menos de 50 caracteres'
            });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedData.email)) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Formato de email inválido'
            });
            return;
        }
        const telefoneRegex = /^\d{9,13}$/;
        if (!telefoneRegex.test(sanitizedData.telefone.replace(/\s/g, ''))) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'Formato de telefone inválido (9-13 dígitos)'
            });
            return;
        }
        if (isPrincipal) {
            yield accountable_1.default.updateMany({ client_id, isPrincipal: true }, { isPrincipal: false });
        }
        const novoAccountable = yield accountable_1.default.create(Object.assign(Object.assign({ client_id }, sanitizedData), { isPrincipal: Boolean(isPrincipal) }));
        winston_1.logger.info('Responsável criado com sucesso', {
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
    }
    catch (err) {
        winston_1.logger.error('Erro durante a criação do responsável', {
            userId,
            error: err instanceof Error ? err.message : err
        });
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});
exports.default = createAccountable;
