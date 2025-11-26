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
const bcrypt_1 = __importDefault(require("bcrypt"));
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const targetUserId = req.params.id;
    const currentUserId = req.userId;
    const { username, email, password, first_name, last_name, role } = req.body;
    try {
        const currentUser = yield user_1.default.findById(currentUserId);
        if (!currentUser || currentUser.role !== 'admin') {
            res.status(403).json({
                code: 'Forbidden',
                message: 'Only administrators can update other users'
            });
            return;
        }
        const targetUser = yield user_1.default.findById(targetUserId);
        if (!targetUser) {
            res.status(404).json({
                code: 'NotFound',
                message: 'User not found'
            });
            return;
        }
        if (username && username !== targetUser.username) {
            const existingUser = yield user_1.default.findOne({ username });
            if (existingUser && existingUser._id.toString() !== targetUserId) {
                res.status(400).json({
                    code: 'UsernameExists',
                    message: 'Username already exists'
                });
                return;
            }
            targetUser.username = username;
        }
        if (email && email !== targetUser.email) {
            const existingUser = yield user_1.default.findOne({ email });
            if (existingUser && existingUser._id.toString() !== targetUserId) {
                res.status(400).json({
                    code: 'EmailExists',
                    message: 'Email already exists'
                });
                return;
            }
            targetUser.email = email;
        }
        if (password) {
            const saltRounds = 10;
            targetUser.password = yield bcrypt_1.default.hash(password, saltRounds);
        }
        if (first_name)
            targetUser.firstName = first_name;
        if (last_name)
            targetUser.lastName = last_name;
        if (role && ['user', 'admin'].includes(role)) {
            targetUser.role = role;
        }
        yield targetUser.save();
        winston_1.logger.info('User updated by admin', {
            adminId: currentUserId,
            targetUserId: targetUserId
        });
        res.status(200).json({
            code: 'UserUpdated',
            message: 'User updated successfully',
        });
    }
    catch (err) {
        winston_1.logger.error('Error updating user by admin', err);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
});
exports.default = updateUser;
