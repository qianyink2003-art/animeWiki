import Fastify from 'fastify'
import * as z from 'zod'
import {Client} from "pg";

export const postgreSQL = new Client({
    user: "qianyink",
    password: "Qianyi_nk20031224",
    host: "localhost",
    port: 5432,
    database: "anime_db",
    statement_timeout: 5000,
    query_timeout: 5000,
    lock_timeout: 5000,
    connectionTimeoutMillis: 5000,
})
try{
    await postgreSQL.connect();
}catch(err){
    console.log(err);
    process.exit(1);
}

const fastify = Fastify({
    logger: true,
});

fastify.get('/*', (request, response) => {
    console.log(request.url);
    response.send("finish");
})

fastify.listen(
    {port:3000},
    function (err, address){
        if (err){
            fastify.log.error(err.message);
            process.exit(1);
        }
        console.log(address);
    }
)