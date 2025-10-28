import { logger } from "@/lib/winston"
import Contact from "@/models/contact"
import Client from "@/models/client"
import type { Response, Request } from "express"

const getContacts = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;

    try {
        if (!userId) {
            res.status(401).json({
                code: 'UNAUTHORIZED',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        const {
            page = 1,
            limit = 10,
            client_id,
            telefone,
            web_site,
            email,
            isPrincipal,
            search = '',
            sortBy = 'publishedAt',
            sortOrder = 'desc'
        } = req.query;

        // Converter e validar parâmetros
        const pageNum = Math.max(1, parseInt(page as string, 10)) || 1;
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10))) || 10;
        const skip = (pageNum - 1) * limitNum;

        // CONSTRUIR QUERY DE FILTRO COM VALIDAÇÃO
        const query: any = {};

        if (client_id) {
            //  Garantir que client_id seja tratado como string
            query.client_id = client_id.toString().trim();
        }

        if (telefone) {
            //  Remover caracteres não numéricos para busca mais precisa
            const cleanedTelefone = telefone.toString().replace(/\D/g, '');
            query.telefone = { $regex: cleanedTelefone, $options: 'i' };
        }

        if (email) {
            query.email = { 
                $regex: email.toString().trim(), 
                $options: 'i' 
            };
        }

        if (web_site) {
            query.web_site = { 
                $regex: web_site.toString().trim(), 
                $options: 'i' 
            };
        }

        // Validação mais robusta para boolean
        if (typeof isPrincipal !== 'undefined') {
            if (isPrincipal === 'true' ) {
                query.isPrincipal = true;
            } else if (isPrincipal === 'false') {
                query.isPrincipal = false;
            }
        }

        // Busca mais abrangente
        if (search) {
            const searchTerm = search.toString().trim();
            const searchRegex = { $regex: searchTerm, $options: 'i' };
            
            query.$or = [
                { email: searchRegex },
                { telefone: searchRegex },
                { web_site: searchRegex },
                //  Buscar também por client_id se necessário
                ...(searchTerm.startsWith('CLI') ? [{ client_id: searchRegex }] : [])
            ];
        }

        //  VALIDAÇÃO DE SORTING
        const sortOptions: any = {};
        const validSortFields = ['publishedAt', 'email', 'telefone', 'isPrincipal', 'createdAt', 'updatedAt'];
        const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'publishedAt';
        sortOptions[sortField as string] = sortOrder === 'asc' ? 1 : -1;

        // BUSCA COM TRATAMENTO DE ERROS
        const [contacts, totalCount] = await Promise.all([
            Contact.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .select('-__v')
                .lean()
                .catch(error => {
                    logger.error('Erro ao buscar contactos', { error: error.message });
                    throw new Error('Falha ao buscar contactos');
                }),
            Contact.countDocuments(query)
                .catch(error => {
                    logger.error('Erro ao contar contactos', { error: error.message });
                    throw new Error('Falha ao contar contactos');
                })
        ]);

        //  Buscar informações dos clientes apenas se houver contactos
        let clientMap = new Map();
        
        if (contacts.length > 0) {
            const clientIds = [...new Set(contacts.map(contact => contact.client_id))];
            
            const clients = await Client.find({ 
                _id: { $in: clientIds } 
            })
            .select('clientName nif email _id')
            .lean()
            .catch(error => {
                logger.warn('Erro ao buscar informações dos clientes', { 
                    error: error.message,
                    clientIds 
                });
                return [];
            });

            // Criar mapa de clientes para acesso rápido
            clientMap = new Map(
                clients.map(client => [client._id, {
                    client_id: client._id,
                    clientName: client.clientName,
                    nif: client.nif,
                }])
            );
        }

        //  PROCESSAR DADOS COM TRATAMENTO DE CAMPOS FALTANTES
        const contactsWithClientInfo = contacts.map(contact => {
            const clientInfo = clientMap.get(contact.client_id) || null;

            return {
                id: contact._id,
                client_id: contact.client_id,
                web_site: contact.web_site || null,
                email: contact.email,
                telefone: contact.telefone,
                isPrincipal: contact.isPrincipal || false,
                publishedAt: contact.publishedAt,
                cliente: clientInfo
            };
        });

        const totalPages = Math.ceil(totalCount / limitNum);

        logger.info('Lista de contactos obtida com sucesso', {
            userId,
            totalContacts: totalCount,
            page: pageNum,
            limit: limitNum,
            hasFilters: Object.keys(query).length > 0
        });

        //  RESPOSTA PADRONIZADA
        res.status(200).json({
            code: 'CONTACTS_RETRIEVED',
            message: 'Contactos obtidos com sucesso',
            data: {
                contacts: contactsWithClientInfo,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCount,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1,
                    pageSize: limitNum
                },
                filters: {
                    ...(client_id && { client_id }),
                    ...(telefone && { telefone }),
                    ...(email && { email }),
                    ...(web_site && { web_site }),
                    ...(isPrincipal !== undefined && { isPrincipal }),
                    ...(search && { search })
                },
                sort: {
                    field: sortField,
                    order: sortOrder
                }
            }
        });

    } catch (err) {
        logger.error('Erro durante a obtenção dos contactos', {
            userId,
            error: err instanceof Error ? err.message : 'Erro desconhecido',
            stack: err instanceof Error ? err.stack : undefined
        });

        res.status(500).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro interno do servidor',
            ...(process.env.NODE_ENV === 'development' && {
                error: err instanceof Error ? err.message : 'Erro desconhecido'
            })
        });
    }
};

export default getContacts;