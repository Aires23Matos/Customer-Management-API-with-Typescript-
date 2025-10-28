import { Router } from 'express';
import authRoutes from '../../routes/v1/auth';
import userRoutes from '../../routes/v1/user';
import clientRoutes from "../../routes/v1/client";
import contactRoutes from "../../routes/v1/contact";
import addressRoutes from "../../routes/v1/address";
import accountableRoutes from "../../routes/v1/accountable";
import licenseDataRoutes from "../../routes/v1/licenseData";
const router = Router();

router.get('/', (req, res) => {
	res.status(200).json({
		message: 'API is live',
		status: 'ok',
		version: '1.0.0',
		docs: 'https://docs.blog-api.codewithsadee.com',
		timeStamp: new Date().toISOString(),
	});
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/client', clientRoutes);
router.use('/contact', contactRoutes);
router.use('/address', addressRoutes);
router.use('/accountable', accountableRoutes);
router.use('/licenses', licenseDataRoutes);

export default router;
