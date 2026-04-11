import {Pool} from "pg";
import fp from "fastify-plugin";
import {type FastifyInstance} from "fastify";
declare module 'fastify' {
    interface FastifyInstance {
        db: Pool;
    }
}

async function dbInit(fastify:FastifyInstance) {
    try{
        const pool = new Pool({
            user: "qianyink",
            password: "Qianyi_nk20031224",
            host: "localhost",
            port: 5432,
            database: "anime_db",
            max: 10,
            connectionTimeoutMillis: 10000
        })
        await pool.query(`SELECT 1`);
        fastify.decorate("db", pool);
    }catch (err){
        console.log("Error in connecting to Postgres");
    }
    console.log("Postgres connection successful!");

    fastify.addHook('onClose', async (instance) => {
        instance.log.info('检测到服务关闭，正在清理数据库连接池...');
        await instance.db.end();
    });
}

export default fp(dbInit, {
    name: "db",
});