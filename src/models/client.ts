import { Schema, model, Types } from "mongoose";

export interface IClient {
    _id?: Types.ObjectId;
    client_id: string;
    clientName: string;
    nif: number;
    publishedAt?: Date;
}

const clientSchema = new Schema<IClient>({
    client_id: {
        type: String,
        required: [true, 'O client_id é obrigatório'],
        unique: [true, 'O client_id deve ser único'],
        default: function() {
            // Gera um ID único baseado no timestamp + random
            return `CLI${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        }
    },
    clientName: {
        type: String,
        required: [true, 'O nome do cliente é obrigatório'],
        maxLength: [20, 'O nome do cliente deve ter menos de 20 caracteres'],
        trim: true
    },
    nif: {
        type: Number,
        required: [true, 'O NIF é obrigatório'],
        validate: {
            validator: function(v: number) {
                return /^\d{9}$/.test(v.toString());
            },
            message: 'O NIF deve ter exatamente 9 dígitos numéricos.'
        },
        unique: [true, 'Este NIF já está registado']
    }
}, {
    timestamps: { 
        createdAt: 'publishedAt',
        updatedAt: false 
    }
});

export default model<IClient>('Client', clientSchema);