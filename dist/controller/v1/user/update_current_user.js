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
const winston_1 = require("../../../lib/winston");
const user_1 = __importDefault(require("../../../models/user"));
const updateCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { username, email, password, first_name, last_name } = req.body;
    try {
        const user = yield user_1.default.findById(userId).select('+password -__v').exec();
        if (!user) {
            res.status(404).json({
                code: 'NotFound',
                message: 'User not found'
            });
            return;
        }
        if (username)
            user.username = username;
        if (email)
            user.email = email;
        if (password)
            user.password = password;
        if (first_name)
            user.firstName = first_name;
        if (last_name)
            user.lastName = last_name;
        yield user.save();
        winston_1.logger.info('User update successfully', user);
        res.status(200).json({
            user,
        });
    }
    catch (err) {
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: err,
        });
        winston_1.logger.error('Erro ao atualizar o usuário atual', err);
    }
});
exports.default = updateCurrentUser;
