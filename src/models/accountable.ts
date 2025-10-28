import { Schema, model, Types } from 'mongoose';

export interface IAccountable {
	_id: Types.ObjectId;
	client_id: string;
	nome: string;
	email: string;
	telefone: string;
	isPrincipal: boolean;
	publishedAt?: Date;
}

const accountableSchema = new Schema<IAccountable>(
	{
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
				validator: function (v: string) {
					return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
				},
				message: 'Formato de email inválido',
			},
		},
		telefone: {
			type: String,
			required: [true, 'O telefone é obrigatório'],
			validate: {
				validator: function (v: string) {
					return /^\d{9,13}$/.test(v.replace(/\s/g, ''));
				},
				message: 'Formato de telefone inválido',
			},
		},
		isPrincipal: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: {
			createdAt: 'publishedAt',
			updatedAt: false,
		},
	},
);

export default model<IAccountable>('Accountable', accountableSchema);
