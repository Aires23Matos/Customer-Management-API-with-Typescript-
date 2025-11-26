"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../../routes/v1/auth"));
const user_1 = __importDefault(require("../../routes/v1/user"));
const client_1 = __importDefault(require("../../routes/v1/client"));
const contact_1 = __importDefault(require("../../routes/v1/contact"));
const address_1 = __importDefault(require("../../routes/v1/address"));
const accountable_1 = __importDefault(require("../../routes/v1/accountable"));
const licenseData_1 = __importDefault(require("../../routes/v1/licenseData"));
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.status(200).json({
        message: 'API is live',
        status: 'ok',
        version: '1.0.0',
        docs: 'https://docs.blog-api.codewithsadee.com',
        timeStamp: new Date().toISOString(),
    });
});
router.use('/auth', auth_1.default);
router.use('/users', user_1.default);
router.use('/client', client_1.default);
router.use('/contact', contact_1.default);
router.use('/address', address_1.default);
router.use('/accountable', accountable_1.default);
router.use('/licenses', licenseData_1.default);
exports.default = router;
