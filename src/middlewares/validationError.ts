import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const ValidationError = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        res.status(400).json({
            code: 'ValidationError',
            errors: errors.mapped(),
        });
        return;
    }

    next();
}

export default ValidationError;
