import {rateLimit} from 'express-rate-limit';

const Limiter  = rateLimit({
    windowMs: 60000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: 'Você enviou para muitos pedidos em um determinado período de tempo, tente novamente mais tarde.'
    }
})

export default Limiter