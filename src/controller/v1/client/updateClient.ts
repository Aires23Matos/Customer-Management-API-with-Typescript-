import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { logger } from "@/lib/winston"
import Client from "@/models/client"
import Address from "@/models/address"
import Contact from "@/models/contact"
import LicenseData from "@/models/licenseData"
import Accountable from "@/models/accountable"
import type { Response, Request } from "express"

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const updateClient = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;
    const { client_id } = req.params;

    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        if (!client_id) {
            res.status(400).json({
                code: 'MissingClientId',
                message: 'ID do cliente é obrigatório'
            });
            return;
        }

        // Verificar se cliente existe
        const existingClient = await Client.findOne({ client_id });
        if (!existingClient) {
            res.status(404).json({
                code: 'ClientNotFound',
                message: 'Cliente não encontrado'
            });
            return;
        }

        const {
            clientName,
            nif,
            enderecos = [],
            contatos = [],
            licencas = [],
            responsaveis = []
        } = req.body;

        // Preparar dados para atualização
        const updateData: any = {};

        if (clientName) {
            updateData.clientName = purify.sanitize(clientName.toString().trim());
            if (updateData.clientName.length > 20) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'O nome do cliente deve ter menos de 20 caracteres'
                });
                return;
            }
        }

        if (nif) {
            updateData.nif = parseInt(nif.toString().trim());
            if (!/^\d{9}$/.test(updateData.nif.toString())) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'O NIF deve ter exatamente 9 dígitos numéricos'
                });
                return;
            }

            // Verificar se novo NIF já existe noutro cliente
            const nifExists = await Client.findOne({ 
                nif: updateData.nif, 
                client_id: { $ne: client_id } 
            });
            if (nifExists) {
                res.status(409).json({
                    code: 'DuplicateNIF',
                    message: 'Já existe outro cliente com este NIF'
                });
                return;
            }
        }

        // Atualizar cliente principal
        if (Object.keys(updateData).length > 0) {
            await Client.updateOne({ client_id }, updateData);
        }

        // Atualizar endereços (substituir todos)
        if (Array.isArray(enderecos)) {
            await Address.deleteMany({ client_id });
            if (enderecos.length > 0) {
                const sanitizedEnderecos = enderecos.map((endereco: any) => ({
                    client_id,
                    morada: purify.sanitize(endereco.morada?.toString().trim() || ''),
                    cidade: purify.sanitize(endereco.cidade?.toString().trim() || ''),
                    codigoPostal: purify.sanitize(endereco.codigoPostal?.toString().trim() || ''),
                    pais: purify.sanitize(endereco.pais?.toString().trim() || 'Portugal')
                }));
                await Address.insertMany(sanitizedEnderecos);
            }
        }

        // Atualizar contactos (substituir todos)
        if (Array.isArray(contatos)) {
            await Contact.deleteMany({ client_id });
            if (contatos.length > 0) {
                const sanitizedContatos = contatos.map((contato: any) => ({
                    client_id,
                    tipo: purify.sanitize(contato.tipo?.toString().trim() || 'email'),
                    valor: purify.sanitize(contato.valor?.toString().trim() || ''),
                    isPrincipal: Boolean(contato.isPrincipal)
                }));
                await Contact.insertMany(sanitizedContatos);
            }
        }

        // Atualizar licenças (substituir todos)
        if (Array.isArray(licencas)) {
            await LicenseData.deleteMany({ client_id });
            if (licencas.length > 0) {
                const sanitizedLicencas = licencas.map((licenca: any) => ({
                    client_id,
                    tipoLicenca: purify.sanitize(licenca.tipoLicenca?.toString().trim() || ''),
                    numeroLicenca: purify.sanitize(licenca.numeroLicenca?.toString().trim() || ''),
                    dataEmissao: new Date(licenca.dataEmissao),
                    dataValidade: new Date(licenca.dataValidade),
                    estado: purify.sanitize(licenca.estado?.toString().trim() || 'ativa')
                }));
                await LicenseData.insertMany(sanitizedLicencas);
            }
        }

        // Atualizar responsáveis (substituir todos)
        if (Array.isArray(responsaveis)) {
            await Accountable.deleteMany({ client_id });
            if (responsaveis.length > 0) {
                const sanitizedResponsaveis = responsaveis.map((responsavel: any) => ({
                    client_id,
                    nome: purify.sanitize(responsavel.nome?.toString().trim() || ''),
                    cargo: purify.sanitize(responsavel.cargo?.toString().trim() || ''),
                    email: purify.sanitize(responsavel.email?.toString().trim() || ''),
                    telefone: purify.sanitize(responsavel.telefone?.toString().trim() || ''),
                    isPrincipal: Boolean(responsavel.isPrincipal)
                }));
                await Accountable.insertMany(sanitizedResponsaveis);
            }
        }

        // Buscar dados atualizados
        const clienteAtualizado = await Client.findOne({ client_id });
        const enderecosAtualizados = await Address.find({ client_id });
        const contatosAtualizados = await Contact.find({ client_id });
        const licencasAtualizadas = await LicenseData.find({ client_id });
        const responsaveisAtualizados = await Accountable.find({ client_id });

        logger.info('Cliente atualizado com sucesso', {
            userId,
            client_id,
            clientName: clienteAtualizado?.clientName
        });

        res.status(200).json({
            code: 'ClientUpdated',
            message: 'Cliente atualizado com sucesso',
            data: {
                cliente: clienteAtualizado,
                enderecos: enderecosAtualizados,
                contatos: contatosAtualizados,
                licencas: licencasAtualizadas,
                responsaveis: responsaveisAtualizados
            }
        });

    } catch (err) {
        logger.error('Erro durante a atualização do cliente', {
            userId,
            client_id,
            error: err instanceof Error ? err.message : err
        });

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export default updateClient;