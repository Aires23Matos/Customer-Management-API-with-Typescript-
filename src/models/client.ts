// models/client.ts
import { Schema, model, Types } from 'mongoose';

export interface IClient {
	_id?: Types.ObjectId;
	client_id: string;
	clientName: string;
	nif: string;
	publishedAt?: Date;
	isBlocked?: boolean;
	blockedAt?: Date;
	blockedBy?: string;
	unblockedAt?: Date;
	unblockedBy?: string;
	blockReason?: string;
}

const clientSchema = new Schema<IClient>(
	{
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
				validator: function (v: string) {
					return /^(?:\d{10}|[A-Za-z0-9]{14})$/.test(v);
				},
				message:
					'O NIF deve ter exatamente 10 dígitos numéricos OU 14 caracteres alfanuméricos.',
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
	},
	{
		timestamps: {
			createdAt: 'publishedAt',
			updatedAt: false,
		},
	},
);

export default model<IClient>('Client', clientSchema);