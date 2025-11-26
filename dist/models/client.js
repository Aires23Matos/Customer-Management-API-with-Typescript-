"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const clientSchema = new mongoose_1.Schema({
    client_id: {
        type: String,
        required: [true, 'O client_id é obrigatório'],
        unique: [true, 'O client_id deve ser único'],
        default: function () {
            return `CLI${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        },
    },
    clientName: {
        type: String,
        required: [true, 'O nome do cliente é obrigatório'],
        maxLength: [20, 'O nome do cliente deve ter menos de 20 caracteres'],
        trim: true,
    },
    nif: {
        type: String,
        required: [true, 'O NIF é obrigatório'],
        validate: {
            validator: function (v) {
                return /^(?:\d{10}|[A-Za-z0-9]{14})$/.test(v);
            },
            message: 'O NIF deve ter exatamente 10 dígitos numéricos OU 14 caracteres alfanuméricos.',
        },
        unique: [true, 'Este NIF já está registado'],
        trim: true,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    blockedAt: {
        type: Date,
    },
    blockedBy: {
        type: String,
    },
    unblockedAt: {
        type: Date,
    },
    unblockedBy: {
        type: String,
    },
    blockReason: {
        type: String,
        maxLength: [500, 'O motivo do bloqueio deve ter menos de 500 caracteres'],
        trim: true,
    },
}, {
    timestamps: {
        createdAt: 'publishedAt',
        updatedAt: false,
    },
});
exports.default = (0, mongoose_1.model)('Client', clientSchema);
