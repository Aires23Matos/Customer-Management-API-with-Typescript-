import { logger } from '@/lib/winston';
import LicenseData from '@/models/licenseData';
import type { Response, Request } from 'express';

const deleteLicenseDataById = async (
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

		// Verificar se licença existe
		const existingLicense = await LicenseData.findById(license_id);
		if (!existingLicense) {
			res.status(404).json({
				code: 'LicenseNotFound',
				message: 'Licença não encontrada',
			});
			return;
		}

		// Eliminar licença
		await LicenseData.findByIdAndDelete(license_id);

		logger.info('Licença eliminada com sucesso', {
			userId,
			license_id,
			client_id: existingLicense.client_id,
			numeroLicenca: existingLicense.numeroLicenca,
		});

		res.status(200).json({
			code: 'LicenseDeleted',
			message: 'Licença eliminada com sucesso',
		});
	} catch (err) {
		logger.error('Erro durante a eliminação da licença', {
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

export default deleteLicenseDataById;
