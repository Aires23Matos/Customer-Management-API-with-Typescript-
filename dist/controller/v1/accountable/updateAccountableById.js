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
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const updateAccountableById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existingAccountable = yield accountable_1.default.findById(accountable_id);
        if (!existingAccountable) {
            res.status(404).json({
                code: 'AccountableNotFound',
                message: 'Responsável não encontrado'
            });
            return;
        }
        const { nome, email, telefone, isPrincipal } = req.body;
        const updateData = {};
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
        if (typeof isPrincipal !== 'undefined') {
            updateData.isPrincipal = Boolean(isPrincipal);
            if (updateData.isPrincipal) {
                yield accountable_1.default.updateMany({
                    client_id: existingAccountable.client_id,
                    _id: { $ne: accountable_id },
                    isPrincipal: true
                }, { isPrincipal: false });
            }
        }
        const accountableAtualizado = yield accountable_1.default.findByIdAndUpdate(accountable_id, updateData, { new: true, runValidators: true });
        winston_1.logger.info('Responsável atualizado com sucesso', {
            userId,
            accountable_id,
            client_id: existingAccountable.client_id
        });
        res.status(200).json({
            code: 'AccountableUpdated',
            message: 'Responsável atualizado com sucesso',
            data: accountableAtualizado
        });
    }
    catch (err) {
        winston_1.logger.error('Erro durante a atualização do responsável', {
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
});
exports.default = updateAccountableById;
