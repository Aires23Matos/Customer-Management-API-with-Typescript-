import { logger } from '@/lib/winston';
import LicenseData from '@/models/licenseData';
import Client from '@/models/client';
import type { Response, Request } from 'express';

const getLicenseDataById = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const userId = req.userId;
	const { license_id } = req.params;

	try {
		if (!userId) {
			res.status(401).json({
				code: 'Unauthorized',
				message: 'Utilizador não autenticado',
			});
			return;
		}

		if (!license_id) {
			res.status(400).json({
				code: 'MissingLicenseId',
				message: 'ID da licença é obrigatório',
			});
			return;
		}

		// Buscar licença
		const license = await LicenseData.findById(license_id).select('-__v');

		if (!license) {
			res.status(404).json({
				code: 'LicenseNotFound',
				message: 'Licença não encontrada',
			});
			return;
		}

		// Buscar informações do cliente
		const client = await Client.findOne({
			client_id: license.client_id,
		}).select('client_id clientName nif');

		const licenseWithClientInfo = {
			...license.toObject(),
			cliente: client
				? {
						client_id: client.client_id,
						clientName: client.clientName,
						nif: client.nif,
					}
				: null,
			// Adicionar informações calculadas
			dias_para_expirar: Math.ceil(
				(license.data_da_expiracao.getTime() - new Date().getTime()) /
					(1000 * 60 * 60 * 24),
			),
			esta_expirada: license.data_da_expiracao < new Date(),
		};

		logger.info('Licença obtida com sucesso', {
			userId,
			license_id,
			client_id: license.client_id,
		});

		res.status(200).json({
			code: 'LicenseRetrieved',
			message: 'Licença obtida com sucesso',
			data: licenseWithClientInfo,
		});
	} catch (err) {
		logger.error('Erro durante a obtenção da licença', {
			userId,
			license_id,
			error: err instanceof Error ? err.message : err,
		});

		res.status(500).json({
			code: 'ServerError',
			message: 'Erro interno do servidor',
			error: process.env.NODE_ENV === 'development' ? err : undefined,
		});
	}
};

export default getLicenseDataById;
