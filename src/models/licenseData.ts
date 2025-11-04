import { Schema, model, Types, Document } from 'mongoose';

export interface ILicenseData extends Document {
	_id: Types.ObjectId;
	client_id: String;
	tecnico: string;
	numeroLicenca: string;
	data_da_ativacao: Date;
	data_da_expiracao: Date;
	data_da_instalacao: Date;
	hora_de_formacao: string;
	validade_em_mes: number;
	conta_pago: 'Pago' | 'Não Pago' | 'Pendente' | 'Parcial';
	valor_pago: number;
	estado: 'ativa' | 'expirada' | 'suspensa' | 'pendente';
	publishedAt?: Date;
}

const licenseDataSchema = new Schema<ILicenseData>(
	{
		client_id: {
			type: String,
			required: [true, 'O client_id é obrigatório'],
			ref: 'Client',
		},
		tecnico: {
			type: String,
			required: [true, 'Nome do técnico é obrigatório'],
			trim: true,
			minlength: [2, 'Nome do técnico deve ter pelo menos 2 caracteres'],
			maxlength: [100, 'Nome do técnico não pode exceder 100 caracteres'],
		},
		numeroLicenca: {
			type: String,
			required: [true, 'Número da licença é obrigatório'],
			unique: [true, 'Este número de licença já está registado'],
			trim: true,
			uppercase: true,
		},
		data_da_instalacao: {
			type: Date,
			required: [true, 'A data de instalação é obrigatória'],
			validate: {
				validator: function (value: Date) {
					return value <= new Date();
				},
				message: 'Data de instalação não pode ser futura',
			},
		},
		data_da_ativacao: {
			type: Date,
			required: [true, 'A data de ativação é obrigatória'],
			validate: {
				validator: function (this: ILicenseData, value: Date) {
					return value >= this.data_da_instalacao;
				},
				message:
					'Data de ativação deve ser posterior ou igual à data de instalação',
			},
		},
		data_da_expiracao: {
			type: Date,
			required: [true, 'A data de expiração é obrigatória'],
			validate: {
				validator: function (this: ILicenseData, value: Date) {
					return value > this.data_da_ativacao;
				},
				message: 'A data de expiração deve ser posterior à data de ativação',
			},
		},
		estado: {
			type: String,
			required: [true, 'O estado da licença é obrigatório'],
			enum: {
				values: ['ativa', 'expirada', 'suspensa', 'pendente'],
				message: 'Estado deve ser: ativa, expirada, suspensa ou pendente',
			},
			default: 'ativa',
		},
		hora_de_formacao: {
			type: String,
			required: [true, 'A hora de formação é obrigatória'],
			match: [
				/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
				'Formato de hora inválido (HH:MM)',
			],
		},
		validade_em_mes: {
			type: Number,
			required: [true, 'A validade em meses é obrigatória'],
			min: [1, 'Validade deve ser de pelo menos 1 mês'],
			max: [120, 'Validade não pode exceder 120 meses'],
		},
		conta_pago: {
			type: String,
			required: [true, 'O estado do pagamento é obrigatório'],
			enum: {
				values: ['Pago', 'Não Pago', 'Pendente', 'Parcial'],
				message: 'Estado deve ser: Pago, Não Pago ou Pendente',
			},
			default: 'Pendente',
		},
		valor_pago: {
			type: Number,
			default: 0,
			min: [0, 'Valor pago não pode ser negativo'],
			validate: {
				validator: function (value: number) {
					return Number.isFinite(value) && value >= 0;
				},
				message: 'Valor pago deve ser um número válido e não negativo',
			},
		},
	},
	{
		timestamps: {
			createdAt: 'publishedAt',
			updatedAt: false,
		},
	},
);

// Middleware para validações adicionais
licenseDataSchema.pre('save', function (next) {
	// Atualizar estado automaticamente baseado na data de expiração
	if (this.data_da_expiracao < new Date() && this.estado === 'ativa') {
		this.estado = 'expirada';
	}

	// Validar consistência do pagamento
	if (this.conta_pago === 'Pago' && this.valor_pago <= 0) {
		next(
			new Error('Licença marcada como paga deve ter valor pago maior que 0'),
		);
		return;
	}

	next();
});

// Índices para melhor performance
licenseDataSchema.index({ client_id: 1 });
licenseDataSchema.index({ data_da_expiracao: 1 });
licenseDataSchema.index({ estado: 1 });
licenseDataSchema.index({ numeroLicenca: 1 }, { unique: true });

// Método estático para buscar licenças ativas
licenseDataSchema.statics.findActiveLicenses = function () {
	return this.find({
		estado: 'ativa',
		data_da_expiracao: { $gte: new Date() },
	});
};

// Método de instância para verificar se está expirada
licenseDataSchema.methods.isExpired = function () {
	return this.data_da_expiracao < new Date();
};

export default model<ILicenseData>('LicenseData', licenseDataSchema);
