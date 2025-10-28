import { Schema, model, Types } from "mongoose";

export interface IContact {
  _id?: Types.ObjectId;
  client_id: string;
  web_site?: string;
  email: string;
  telefone: string;
  isPrincipal: boolean;
  publishedAt?: Date;
}

const contactSchema = new Schema<IContact>({
  client_id: {
    type: String,
    required: [true, 'O client_id é obrigatório'],
    ref: 'Client'
  },
  web_site: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Opcional
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
      },
      message: 'Formato do website inválido'
    }
  },
  email: {
    type: String,
    required: [true, 'O email é obrigatório'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Formato do email inválido'
    }
  },
  telefone: {
    type: String,
    required: [true, 'O telefone é obrigatório'],
    trim: true,
    validate: {
      validator: function(v: string) {
        // Remove espaços, parênteses, hífens e outros caracteres especiais
        const cleaned = v.replace(/[\s\(\)\-\.\+]/g, '');
        return /^\d{9,13}$/.test(cleaned);
      },
      message: 'Telefone deve conter entre 9 e 13 dígitos'
    }
  },
  isPrincipal: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { 
    createdAt: 'publishedAt',
    updatedAt: false 
  }
});

// Middleware para garantir apenas um contato principal por cliente
contactSchema.pre('save', async function(next) {
  if (this.isPrincipal) {
    try {
      // Encontrar e atualizar outros contatos principais do mesmo cliente
      await this.model('Contact').updateMany(
        { 
          client_id: this.client_id, 
          _id: { $ne: this._id },
          isPrincipal: true 
        },
        { isPrincipal: false }
      );
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Índices para melhor performance
contactSchema.index({ client_id: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ client_id: 1, isPrincipal: 1 });

// Método estático para buscar contato principal de um cliente
contactSchema.statics.findPrincipalContact = function(clientId: Types.ObjectId) {
  return this.findOne({ client_id: clientId, isPrincipal: true });
};

// Método estático para buscar todos os contatos de um cliente
contactSchema.statics.findContactsByClient = function(clientId: Types.ObjectId) {
  return this.find({ client_id: clientId }).sort({ isPrincipal: -1, publishedAt: -1 });
};

// Método de instância para validar formato internacional do telefone
contactSchema.methods.getInternationalFormat = function() {
  const cleaned = this.telefone.replace(/[\s\(\)\-\.]/g, '');
  return `+${cleaned}`;
};

export default model<IContact>('Contact', contactSchema);