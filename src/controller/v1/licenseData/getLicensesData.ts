import { logger } from '@/lib/winston';
import LicenseData from '@/models/licenseData';
import Client from '@/models/client';
import type { Response, Request } from 'express';

const getLicensesData = async (req: Request, res: Response): Promise<void> => {
	const userId = req.userId;

	try {
		if (!userId) {
			res.status(401).json({
				code: 'Unauthorized',
				message: 'Utilizador não autenticado',
			});
			return;
		}

		const {
			page = 1,
			limit = 10,
			client_id,
			estado,
			conta_pago,
			expiradas,
			search = '',
		} = req.query;

		const pageNum = parseInt(page as string);
		const limitNum = parseInt(limit as string);
		const skip = (pageNum - 1) * limitNum;

		// Construir query
		const query: any = {};

		if (client_id) {
			query.client_id = client_id;
		}

		if (estado) {
			query.estado = estado;
		}

		if (conta_pago) {
			query.conta_pago = conta_pago;
		}

		// Filtrar por licenças expiradas
		if (expiradas === 'true') {
			query.data_da_expiracao = { $lt: new Date() };
		} else if (expiradas === 'false') {
			query.data_da_expiracao = { $gte: new Date() };
		}

		if (search) {
			query.$or = [
				{ tecnico: { $regex: search, $options: 'i' } },
				{ numeroLicenca: { $regex: search, $options: 'i' } },
			];
		}

		// Buscar licenças com paginação
		const [licenses, totalCount] = await Promise.all([
			LicenseData.find(query)
				.sort({ data_da_expiracao: 1 })
				.skip(skip)
				.limit(limitNum)
				.select('-__v'),
			LicenseData.countDocuments(query),
		]);

		// Buscar informações dos clientes
		const clientIds = [
			...new Set(licenses.map((license) => license.client_id)),
		];
		const clients = await Client.find({ client_id: { $in: clientIds } }).select(
			'client_id clientName nif',
		);

		// Enriquecer licenças com dados do cliente
		const licensesWithClientInfo = licenses.map((license) => {
			const client = clients.find((c) => c.client_id === license.client_id);
			return {
				...license.toObject(),
				cliente: client
					? {
							client_id: client.client_id,
							clientName: client.clientName,
							nif: client.nif,
						}
					: null,
			};
		});

		const totalPages = Math.ceil(totalCount / limitNum);

		logger.info('Lista de licenças obtida com sucesso', {
			userId,
			totalLicenses: totalCount,
			page: pageNum,
			limit: limitNum,
		});

		res.status(200).json({
			code: 'LicensesRetrieved',
			message: 'Licenças obtidas com sucesso',
			data: {
				licenses: licensesWithClientInfo,
				pagination: {
					currentPage: pageNum,
					totalPages,
					totalCount,
					hasNext: pageNum < totalPages,
					hasPrev: pageNum > 1,
				},
			},
		});
	} catch (err) {
		logger.error('Erro durante a obtenção das licenças', {
			userId,
			error: err instanceof Error ? err.message : err,
		});

		res.status(500).json({
			code: 'ServerError',
			message: 'Erro interno do servidor',
			error: process.env.NODE_ENV === 'development' ? err : undefined,
		});
	}
};

export default getLicensesData;
