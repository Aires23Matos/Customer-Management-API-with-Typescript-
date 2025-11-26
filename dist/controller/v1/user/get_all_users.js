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
const config_1 = __importDefault(require("../../../config"));
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const limit = (_a = parseInt(req.query.limit)) !== null && _a !== void 0 ? _a : config_1.default.defaultResLimit;
        const offset = (_b = parseInt(req.query.office)) !== null && _b !== void 0 ? _b : config_1.default.defaultResOffset;
        const total = yield user_1.default.countDocuments();
        const users = yield user_1.default.find()
            .select('-__v')
            .limit(limit)
            .skip(offset)
            .lean()
            .exec();
        res.status(200).json({
            limit,
            offset,
            total,
            users
        });
    }
    catch (err) {
        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: err,
        });
        winston_1.logger.error('Erro ao buscando todos usuário atuais', err);
    }
});
exports.default = getAllUsers;
