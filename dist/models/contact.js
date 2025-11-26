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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const contactSchema = new mongoose_1.Schema({
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
            validator: function (v) {
                if (!v)
                    return true;
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
            validator: function (v) {
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
            validator: function (v) {
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
contactSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isPrincipal) {
            try {
                yield this.model('Contact').updateMany({
                    client_id: this.client_id,
                    _id: { $ne: this._id },
                    isPrincipal: true
                }, { isPrincipal: false });
            }
            catch (error) {
                return next(error);
            }
        }
        next();
    });
});
contactSchema.index({ client_id: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ client_id: 1, isPrincipal: 1 });
contactSchema.statics.findPrincipalContact = function (clientId) {
    return this.findOne({ client_id: clientId, isPrincipal: true });
};
contactSchema.statics.findContactsByClient = function (clientId) {
    return this.find({ client_id: clientId }).sort({ isPrincipal: -1, publishedAt: -1 });
};
contactSchema.methods.getInternationalFormat = function () {
    const cleaned = this.telefone.replace(/[\s\(\)\-\.]/g, '');
    return `+${cleaned}`;
};
exports.default = (0, mongoose_1.model)('Contact', contactSchema);
