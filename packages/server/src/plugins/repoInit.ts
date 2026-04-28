import AniDb from "../services/AnimeDbUtils.js";

import fp from "fastify-plugin"
import type {FastifyInstance} from "fastify";

declare module "fastify" {
    interface FastifyInstance {
        aniDb:AniDb
    }
}

async function repoInit(fastify:FastifyInstance) {
    const aniDb = new AniDb(fastify.db);

    await aniDb.createTable();

    fastify.decorate("aniDb", aniDb);
}

export default fp(repoInit, {
    dependencies: ['db'],
    name: "repo",
});