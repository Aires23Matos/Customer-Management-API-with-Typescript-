"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const addressSchema = new mongoose_1.Schema({
    client_id: {
        type: String,
        required: [true, 'O client_id é obrigatório'],
        ref: 'Client',
    },
    provincia: {
        type: String,
        required: [true, 'A morada é obrigatória'],
        maxLength: [50, 'A morada deve ter menos de 10 caracteres'],
    },
    municipio: {
        type: String,
        required: [true, 'A municipio é obrigatória'],
        maxLength: [50, 'A municipio deve ter menos de 50 caracteres'],
    },
    bairro: {
        type: String,
        required: [true, 'A bairro é obrigatória'],
        maxLength: [50, 'A bairro deve ter menos de 50 caracteres'],
    },
    rua_ou_avenida: {
        type: String,
        required: [true, 'A rua ou avenida é obrigatória'],
        maxLength: [50, 'A rua ou avenida deve ter menos de 50 caracteres'],
    },
    numero_da_casa: {
        type: String,
        required: [true, 'A numero da casa é obrigatória'],
        maxLength: [50, 'A numero da casa deve ter menos de 50 caracteres'],
    },
    ponto_de_referencia: {
        type: String,
        required: [true, 'O ponto de referencia é obrigatório'],
        default: '',
    },
}, {
    timestamps: {
        createdAt: 'publishedAt',
        updatedAt: false,
    },
});
exports.default = (0, mongoose_1.model)('Address', addressSchema);
