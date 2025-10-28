import winston from "winston";
import Config from "src/config";

const {combine, timestamp, json, errors, align,printf,colorize} = winston.format;

const transports: winston.transport[] = [];

if(Config.node_env !== 'production'){
    transports.push(
        new winston.transports.Console({
            format: combine(
                colorize({all: true}),
                timestamp({format: 'YYYY-MM-DD hh:mm:ss A'}),
                align(),
                printf(({timestamp, level,message, ...meta}) => {
                    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta)}` : '';
                    return `${timestamp} [${level}]: ${message}${metaStr}`
                })
            )
        })
    )
}

const logger = winston.createLogger({
    level: Config.log_level || 'info',
    format: combine(timestamp(), errors({stack: true}), json()),
    transports,
    silent: Config.node_env === 'test',
})

export {logger};