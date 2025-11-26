import { logger } from '@/lib/winston';
import User from '@/models/user';
import type { Response, Request } from 'express';
import bcrypt from 'bcrypt';

const updateUser = async (req: Request, res: Response): Promise<void> => {
    const targetUserId = req.params.id; // ID do usuário a ser editado
    const currentUserId = req.userId; // ID do usuário logado
    
    const { username, email, password, first_name, last_name, role } = req.body;
    
    try {
        // Verificar se o usuário atual é admin
        const currentUser = await User.findById(currentUserId);
        if (!currentUser || currentUser.role !== 'admin') {
            res.status(403).json({
                code: 'Forbidden',
                message: 'Only administrators can update other users'
            });
            return;
        }

        // Buscar usuário alvo
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            res.status(404).json({
                code: 'NotFound',
                message: 'User not found'
            });
            return;
        }

        // Verificar unicidade do username
        if (username && username !== targetUser.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== targetUserId) {
                res.status(400).json({
                    code: 'UsernameExists',
                    message: 'Username already exists'
                });
                return;
            }
            targetUser.username = username;
        }

        // Verificar unicidade do email
        if (email && email !== targetUser.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== targetUserId) {
                res.status(400).json({
                    code: 'EmailExists',
                    message: 'Email already exists'
                });
                return;
            }
            targetUser.email = email;
        }

        // Atualizar senha (sem verificação de senha atual para admin)
        if (password) {
            const saltRounds = 10;
            targetUser.password = await bcrypt.hash(password, saltRounds);
        }

        // Atualizar outros campos
        if (first_name) targetUser.firstName = first_name;
        if (last_name) targetUser.lastName = last_name;
        if (role && ['user', 'admin'].includes(role)) {
            targetUser.role = role;
        }

        await targetUser.save();
        
      

        logger.info('User updated by admin', { 
            adminId: currentUserId, 
            targetUserId: targetUserId 
        });

        res.status(200).json({
            code: 'UserUpdated',
            message: 'User updated successfully',
        });
        
    } catch (err) {
        logger.error('Error updating user by admin', err);
        res.status(500).json({
            code: 'ServerError',
            message: 'Internal server error',
        });
    }
};

export default updateUser;