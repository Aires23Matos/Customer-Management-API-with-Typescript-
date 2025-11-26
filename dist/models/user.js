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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password')) {
            next();
            return;
        }
        this.password = yield bcrypt_1.default.hash(this.password, 0);
        next();
    });
});
exports.default = (0, mongoose_1.model)('User', userSchema);
