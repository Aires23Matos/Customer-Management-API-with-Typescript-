import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { logger } from "@/lib/winston"
import Client from "@/models/client"
import address from "@/models/address"
import licenseData from "@/models/licenseData"
import accountable from "@/models/accountable"
import type { Response, Request } from "express"
import contact from "@/models/contact"

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const createClient = async (
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
        const {
            clientName,
            nif,
            enderecos = [],
            contatos = [],
            licencas = [],
            responsaveis = []
        } = req.body;

        // Validar campos obrigatórios
        if (!clientName || !nif) {
            res.status(400).json({
                code: 'MissingFields',
                message: 'Nome do cliente e NIF são obrigatórios'
            });
            return;
        }

        // Sanitizar dados
        const sanitizedClientName = purify.sanitize(clientName.toString().trim());
        const sanitizedNif = parseInt(nif.toString().trim());

        // Validar comprimento do nome
        if (sanitizedClientName.length > 20) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'O nome do cliente deve ter menos de 20 caracteres'
            });
            return;
        }

        // Validar NIF (9 dígitos)
        if (!/^\d{9}$/.test(sanitizedNif.toString())) {
            res.status(400).json({
                code: 'InvalidField',
                message: 'O NIF deve ter exatamente 9 dígitos numéricos'
            });
            return;
        }

        // Verificar se NIF já existe
        const existingClient = await Client.findOne({ nif: sanitizedNif });
        if (existingClient) {
            res.status(409).json({
                code: 'DuplicateNIF',
                message: 'Já existe um cliente com este NIF'
            });
            return;
        }

        // Criar cliente principal
        const novoCliente = await Client.create({
            clientName: sanitizedClientName,
            nif: sanitizedNif
        });

        const clientId = novoCliente.client_id;

        // Criar endereços relacionados (se fornecidos)
        if (enderecos.length > 0) {
            const sanitizedEnderecos = enderecos.map((endereco: any) => ({
                client_id: clientId,
                morada: purify.sanitize(endereco.morada?.toString().trim() || ''),
                cidade: purify.sanitize(endereco.cidade?.toString().trim() || ''),
                codigoPostal: purify.sanitize(endereco.codigoPostal?.toString().trim() || ''),
                pais: purify.sanitize(endereco.pais?.toString().trim() || 'Portugal')
            }));

            await address.insertMany(sanitizedEnderecos);
        }

        // Criar contactos relacionados (se fornecidos)
        if (contatos.length > 0) {
            const sanitizedContatos = contatos.map((contato: any) => ({
                client_id: clientId,
                tipo: purify.sanitize(contato.tipo?.toString().trim() || 'email'),
                valor: purify.sanitize(contato.valor?.toString().trim() || ''),
                isPrincipal: Boolean(contato.isPrincipal)
            }));

            await contact.insertMany(sanitizedContatos);
        }

        // Criar licenças relacionadas (se fornecidas)
        if (licencas.length > 0) {
            const sanitizedLicencas = licencas.map((licenca: any) => ({
                client_id: clientId,
                tipoLicenca: purify.sanitize(licenca.tipoLicenca?.toString().trim() || ''),
                numeroLicenca: purify.sanitize(licenca.numeroLicenca?.toString().trim() || ''),
                dataEmissao: new Date(licenca.dataEmissao),
                dataValidade: new Date(licenca.dataValidade),
                estado: purify.sanitize(licenca.estado?.toString().trim() || 'ativa')
            }));

            await licenseData.insertMany(sanitizedLicencas);
        }

        // Criar responsáveis relacionados (se fornecidos)
        if (responsaveis.length > 0) {
            const sanitizedResponsaveis = responsaveis.map((responsavel: any) => ({
                client_id: clientId,
                nome: purify.sanitize(responsavel.nome?.toString().trim() || ''),
                cargo: purify.sanitize(responsavel.cargo?.toString().trim() || ''),
                email: purify.sanitize(responsavel.email?.toString().trim() || ''),
                telefone: purify.sanitize(responsavel.telefone?.toString().trim() || ''),
                isPrincipal: Boolean(responsavel.isPrincipal)
            }));

            await accountable.insertMany(sanitizedResponsaveis);
        }

        // Buscar dados completos do cliente criado
        const clienteCompleto = await Client.findOne({ client_id: clientId });
        const enderecosCliente = await address.find({ client_id: clientId });
        const contatosCliente = await contact.find({ client_id: clientId });
        const licencasCliente = await licenseData.find({ client_id: clientId });
        const responsaveisCliente = await accountable.find({ client_id: clientId });

        // Log de sucesso
        logger.info('Cliente criado com sucesso', {
            userId,
            clientId,
            clientName: sanitizedClientName
        });

        // Response de sucesso
        res.status(201).json({
            code: 'ClientCreated',
            message: 'Cliente criado com sucesso',
            data: {
                cliente: clienteCompleto,
                enderecos: enderecosCliente,
                contatos: contatosCliente,
                licencas: licencasCliente,
                responsaveis: responsaveisCliente
            }
        });

    } catch (err) {
        // Log de erro detalhado
        logger.error('Erro durante a criação do cliente', {
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

export default createClient;