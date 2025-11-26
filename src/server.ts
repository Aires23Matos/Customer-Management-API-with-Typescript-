import express from 'express';
import Config from './config';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import Limiter from './lib/express_rate_limit';

import v1Route from './routes/v1/index';
import { connectToDatabase, disconnectFromDatabase } from './database/mongoose';
import { logger } from './lib/winston';

const app = express();
const PORT = Config;

//configure CORS options
const corsOption: CorsOptions = {
	origin(origin, callback) {
		const isDev = process.env.NODE_ENV === 'development';

		if (isDev || !origin || PORT.whitelist_origins.includes(origin)) {
			callback(null, true);
		} else {
			logger.warn(`🚫 CORS bloqueado: ${origin} não é permitido pelos cors`);
			callback(
				new Error(`CORS error: ${origin} não é permitido pelos cors`),
				false,
			);
		}
	},
};


app.use(cors(corsOption));


app.use(express.json());



app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
	compression({
		threshold: 1024,
	}),
);


app.use(helmet());


app.use(Limiter);

//middleware
(async () => {
	try {
		await connectToDatabase();
		app.use('/api/v1', v1Route);

		app.listen(PORT, () => {
			logger.info(`erverS Runing http://localhost:${PORT}`);
		});
	} catch (err) {
		logger.error('Falha ao iniciar o servidor', err);
		if (PORT.node_env === 'production') {
			process.exit(1);
		}
	}
})();

const handleServerShutdown = async () => {
	await disconnectFromDatabase();
	try {
		logger.warn('Server SHUTDOWN');
		process.exit(0);
	} catch (err) {
		logger.error('Error during server shutdown', err);
	}
};

process.on('SIGTERM', handleServerShutdown);
process.on('SIGINT', handleServerShutdown);
