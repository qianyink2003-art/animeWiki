import Fastify from 'fastify'
import dbInit from "./plugins/dbInit.js"
import repoInit from "./plugins/repoInit.js"
import {fastifyStatic} from "@fastify/static";
import dbManageRouterInit from "./router/dbManage.js";


import path from "path"
export const rootPath:string = import.meta.dirname;
const fastify = Fastify({
    logger: true,
});

fastify.register(fastifyStatic, {
    root: path.resolve(rootPath, `../public`),
    prefix: "/static/"
});
fastify.register(dbInit);
fastify.register(repoInit);

fastify.register(dbManageRouterInit,{
    prefix: "/api/"
});

fastify.get('/', (request, response) => {
    response.send("finish");
})
//启动服务
fastify.listen({
        port:3000
    },
    function (err, address){
        if (err){
            fastify.log.error(err.message);
            process.exit(1);
        }
    }
)