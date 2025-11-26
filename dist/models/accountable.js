"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const accountableSchema = new mongoose_1.Schema({
    client_id: {
        type: String,
        required: [true, 'O client_id é obrigatório'],
        ref: 'Client',
    },
    nome: {
        type: String,
        required: [true, 'O nome do responsável é obrigatório'],
        maxLength: [50, 'O nome deve ter menos de 50 caracteres'],
    },
    email: {
        type: String,
        required: [true, 'O email é obrigatório'],
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Formato de email inválido',
        },
    },
    telefone: {
        type: String,
        required: [true, 'O telefone é obrigatório'],
        validate: {
            validator: function (v) {
                return /^\d{9,13}$/.test(v.replace(/\s/g, ''));
            },
            message: 'Formato de telefone inválido',
        },
    },
    isPrincipal: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: {
        createdAt: 'publishedAt',
        updatedAt: false,
    },
});
exports.default = (0, mongoose_1.model)('Accountable', accountableSchema);
