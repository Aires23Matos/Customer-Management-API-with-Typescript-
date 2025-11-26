// controllers/blockedClientsController.ts
import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { logger } from "../../../lib/winston"
import Client from "../../../models/client"
import address from "../../../models/address"
import licenseData from "../../../models/licenseData"
import accountable from "../../../models/accountable"
import type { Response, Request } from "express"
import contact from "../../../models/contact"

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Bloquear um cliente
const blockClient = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;

    try {
        // Validar se userId existe
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        // Sanitizar e validar dados do request body
        const { clientId, motivo } = req.body;

        // Validar campos obrigatórios
        if (!clientId) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'ID do cliente é obrigatório'
            });
            return;
        }

        // Sanitizar dados
        const sanitizedClientId = purify.sanitize(clientId.toString().trim());
        const sanitizedMotivo = motivo ? purify.sanitize(motivo.toString().trim()) : '';

        // Validar comprimento do motivo
        if (sanitizedMotivo.length > 500) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'O motivo do bloqueio deve ter menos de 500 caracteres'
            });
            return;
        }

        // Verificar se cliente existe
        const existingClient = await Client.findOne({ client_id: sanitizedClientId });
        if (!existingClient) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }

        // Verificar se cliente já está bloqueado
        if (existingClient.isBlocked) {
            res.status(409).json({
                code: 'ClientAlreadyBlocked',
                message: 'Cliente já está bloqueado'
            });
            return;
        }

        // Atualizar cliente para bloqueado
        const updatedClient = await Client.findOneAndUpdate(
            { client_id: sanitizedClientId },
            { 
                isBlocked: true,
                blockedAt: new Date(),
                blockedBy: userId,
                blockReason: sanitizedMotivo
            },
            { new: true }
        );

        // Log de sucesso
        logger.info('Cliente bloqueado com sucesso', {
            userId,
            clientId: sanitizedClientId,
            motivo: sanitizedMotivo
        });

        // Response de sucesso
        res.status(200).json({
            code: 'ClientBlocked',
            message: 'Cliente bloqueado com sucesso',
            data: {
                cliente: updatedClient
            }
        });

    } catch (err) {
        // Log de erro detalhado
        logger.error('Erro durante o bloqueio do cliente', {
            userId,
            error: err instanceof Error ? err.message : err,
            stack: err instanceof Error ? err.stack : undefined
        });

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

// Desbloquear um cliente
const unblockClient = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;

    try {
        // Validar se userId existe
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        // Sanitizar e validar dados do request body
        const { clientId } = req.body;

        // Validar campos obrigatórios
        if (!clientId) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'ID do cliente é obrigatório'
            });
            return;
        }

        // Sanitizar dados
        const sanitizedClientId = purify.sanitize(clientId.toString().trim());

        // Verificar se cliente existe
        const existingClient = await Client.findOne({ client_id: sanitizedClientId });
        if (!existingClient) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }

        // Verificar se cliente já está desbloqueado
        if (!existingClient.isBlocked) {
            res.status(409).json({
                code: 'ClientNotBlocked',
                message: 'Cliente não está bloqueado'
            });
            return;
        }

        // Atualizar cliente para desbloqueado
        const updatedClient = await Client.findOneAndUpdate(
            { client_id: sanitizedClientId },
            { 
                isBlocked: false,
                unblockedAt: new Date(),
                unblockedBy: userId,
                blockReason: null
            },
            { new: true }
        );

        // Log de sucesso
        logger.info('Cliente desbloqueado com sucesso', {
            userId,
            clientId: sanitizedClientId
        });

        // Response de sucesso
        res.status(200).json({
            code: 'ClientUnblocked',
            message: 'Cliente desbloqueado com sucesso',
            data: {
                cliente: updatedClient
            }
        });

    } catch (err) {
        // Log de erro detalhado
        logger.error('Erro durante o desbloqueio do cliente', {
            userId,
            error: err instanceof Error ? err.message : err,
            stack: err instanceof Error ? err.stack : undefined
        });

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

// Listar todos os clientes bloqueados
const getBlockedClients = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;

    try {
        // Validar se userId existe
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        // Buscar todos os clientes bloqueados
        const blockedClients = await Client.find({ isBlocked: true });

        // Buscar informações relacionadas para cada cliente bloqueado
        const blockedClientsWithDetails = await Promise.all(
            blockedClients.map(async (client) => {
                const [enderecos, contatos, licencas, responsaveis] = await Promise.all([
                    address.find({ client_id: client.client_id }),
                    contact.find({ client_id: client.client_id }),
                    licenseData.find({ client_id: client.client_id }),
                    accountable.find({ client_id: client.client_id })
                ]);

                return {
                    cliente: client,
                    enderecos,
                    contatos,
                    licencas,
                    responsaveis
                };
            })
        );

        // Log de consulta
        logger.info('Lista de clientes bloqueados consultada', {
            userId,
            totalBlocked: blockedClients.length
        });

        // Response de sucesso
        res.status(200).json({
            code: 'BlockedClientsRetrieved',
            message: 'Clientes bloqueados recuperados com sucesso',
            data: {
                total: blockedClients.length,
                clientes: blockedClientsWithDetails
            }
        });

    } catch (err) {
        // Log de erro detalhado
        logger.error('Erro durante a consulta de clientes bloqueados', {
            userId,
            error: err instanceof Error ? err.message : err,
            stack: err instanceof Error ? err.stack : undefined
        });

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

// Verificar se um cliente específico está bloqueado
const checkClientBlockStatus = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;

    try {
        // Validar se userId existe
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        const { clientId } = req.params;

        // Validar campos obrigatórios
        if (!clientId) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'ID do cliente é obrigatório'
            });
            return;
        }

        // Sanitizar dados
        const sanitizedClientId = purify.sanitize(clientId.toString().trim());

        // Buscar cliente
        const client = await Client.findOne({ client_id: sanitizedClientId });

        if (!client) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }

        // Response com status do bloqueio
        res.status(200).json({
            code: 'ClientStatusRetrieved',
            message: 'Status do cliente recuperado com sucesso',
            data: {
                clientId: sanitizedClientId,
                clientName: client.clientName,
                isBlocked: client.isBlocked,
                blockedAt: client.blockedAt,
                blockedBy: client.blockedBy,
                blockReason: client.blockReason
            }
        });

    } catch (err) {
        // Log de erro detalhado
        logger.error('Erro durante a verificação do status do cliente', {
            userId,
            error: err instanceof Error ? err.message : err,
            stack: err instanceof Error ? err.stack : undefined
        });

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export {
    blockClient,
    unblockClient,
    getBlockedClients,
    checkClientBlockStatus
};