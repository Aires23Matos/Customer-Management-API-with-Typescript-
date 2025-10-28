import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import { logger } from "@/lib/winston"
import Address from "@/models/address"
import type { Response, Request } from "express"

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const updateAddressById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const userId = req.userId;
    const { address_id } = req.params;

    try {
        if (!userId) {
            res.status(401).json({
                code: 'Unauthorized',
                message: 'Utilizador não autenticado'
            });
            return;
        }

        if (!address_id) {
            res.status(400).json({
                code: 'MissingAddressId',
                message: 'ID do endereço é obrigatório'
            });
            return;
        }

        // Verificar se endereço existe
        const existingAddress = await Address.findById(address_id);
        if (!existingAddress) {
            res.status(404).json({
                code: 'AddressNotFound',
                message: 'Endereço não encontrado'
            });
            return;
        }

        const {
            provincia,
            municipio,
            bairro,
            rua_ou_avenida,
            numero_da_casa,
            ponto_de_referencia
        } = req.body;

        const updateData: any = {};

        // Atualizar campos se fornecidos
        if (provincia) {
            const sanitizedProvincia = purify.sanitize(provincia.toString().trim());
            if (sanitizedProvincia.length > 10) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'A provincia deve ter menos de 10 caracteres'
                });
                return;
            }
            updateData.provincia = sanitizedProvincia;
        }

        if (municipio) {
            const sanitizedMunicipio = purify.sanitize(municipio.toString().trim());
            if (sanitizedMunicipio.length > 50) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'O municipio deve ter menos de 50 caracteres'
                });
                return;
            }
            updateData.municipio = sanitizedMunicipio;
        }

        if (bairro) {
            const sanitizedBairro = purify.sanitize(bairro.toString().trim());
            if (sanitizedBairro.length > 50) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'O bairro deve ter menos de 50 caracteres'
                });
                return;
            }
            updateData.bairro = sanitizedBairro;
        }

        if (rua_ou_avenida) {
            const sanitizedRua = purify.sanitize(rua_ou_avenida.toString().trim());
            if (sanitizedRua.length > 50) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'A rua ou avenida deve ter menos de 50 caracteres'
                });
                return;
            }
            updateData.rua_ou_avenida = sanitizedRua;
        }

        if (numero_da_casa) {
            const sanitizedNumero = purify.sanitize(numero_da_casa.toString().trim());
            if (sanitizedNumero.length > 50) {
                res.status(400).json({
                    code: 'InvalidField',
                    message: 'O número da casa deve ter menos de 50 caracteres'
                });
                return;
            }
            updateData.numero_da_casa = sanitizedNumero;
        }

        if (ponto_de_referencia !== undefined) {
            updateData.ponto_de_referencia = purify.sanitize(ponto_de_referencia.toString().trim());
        }

        // Atualizar endereço
        const enderecoAtualizado = await Address.findByIdAndUpdate(
            address_id,
            updateData,
            { new: true, runValidators: true }
        );

        logger.info('Endereço atualizado com sucesso', {
            userId,
            address_id,
            client_id: existingAddress.client_id
        });

        res.status(200).json({
            code: 'AddressUpdated',
            message: 'Endereço atualizado com sucesso',
            data: enderecoAtualizado
        });

    } catch (err) {
        logger.error('Erro durante a atualização do endereço', {
            userId,
            address_id,
            error: err instanceof Error ? err.message : err
        });

        res.status(500).json({
            code: 'ServerError',
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
};

export default updateAddressById;