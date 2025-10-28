import mongoose from "mongoose";
import Config from "src/config";
import type { ConnectOptions } from "mongoose";
import { logger } from "src/lib/winston";

const clientOptions: ConnectOptions = {
    dbName: 'API_Gestor',
    serverApi: {    
        version: '1',
        strict: true,
        deprecationErrors: true
    }
}

export const connectToDatabase = async (): Promise<void> => {
    if(!Config.mongo_url){
        throw new Error('Mongo URL não está definido na configuração')
    }
    try{
        await mongoose.connect(Config.mongo_url, clientOptions);
        logger.info(
            'Conectado ao banco de dados com êxito.',{
                url: Config.mongo_url,
                options: clientOptions
            }
        )
    }catch(err){
        if(err instanceof Error){
            throw err;
        }
        logger.error('Erro ao conectar-se ao banco de dados', err)
    }
}

export const disconnectFromDatabase = async (): Promise<void> =>{
    try{
        await mongoose.disconnect();

        logger.info('Desconectar do banco de dados com êxito',{
            url: Config.mongo_url,
            option: clientOptions
        })
    }catch(err){
        if(err instanceof Error){
            throw new Error(err.message);
        }
        logger.error('Erro ao desconectar o banco de dados', err)
    }
}