"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genUsername = void 0;
const genUsername = () => {
    const usernamePrefix = 'user-';
    const randomCharts = Math.random().toString(36).slice(2);
    const username = usernamePrefix + randomCharts;
    return username;
};
exports.genUsername = genUsername;
