import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
	username: string;
	email: string;
	password: string;
	role: 'admin' | 'user';
	firstName?: string;
	lastName?: string;
}

const userSchema = new Schema<IUser>(
	{
		username: {
			type: String,
			required: [true, 'O nome de utilizador é obrigatório'],
			maxLength: [20, 'O nome de usuário deve ter menos de 20 caracteres'],
			unique: [true, 'O nome de usuário deve ser exclusivo'],
		},
		email: {
			type: String,
			required: [true, 'O e-mail é obrigatório'],
			maxLength: [50, 'O e-mail deve ter menos de 50 caracteres'],
			unique: [true, 'O e-mail deve ser exclusivo'],
		},
		password: {
			type: String,
			required: [true, 'password is required'],
			select: false,
		},
		role: {
			type: String,
			required: [true, 'Role is required'],
			enum: {
				values: ['admin', 'user'],
				message: '{VALUE} is not support',
			},
			default: 'user',
		},
		firstName: {
			type: String,
			maxLength: [20, 'O nome próprio deve ter menos de 20 caracteres'],
		},
		lastName: {
			type: String,
			maxLength: [20, 'O sobrenome deve ter menos de 20 caracteres'],
		},
	},
	{
		timestamps: true,
	},
);

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		next();
		return;
	}

	this.password = await bcrypt.hash(this.password, 0);
	next();
});
export default model<IUser>('User', userSchema);
