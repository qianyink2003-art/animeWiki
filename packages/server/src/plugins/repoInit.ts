import BasicRepository from "../repository/BasicRepository.js"

import fp from "fastify-plugin"
import type {FastifyInstance} from "fastify";

interface Repo {
    basicRepo: BasicRepository
}
declare module "fastify" {
    interface FastifyInstance {
        repo:Repo
    }
}

async function repoInit(fastify:FastifyInstance) {
    const basicRepo = new BasicRepository(fastify.db);
    await basicRepo.creatTable();

    const repo = {
        basicRepo: basicRepo
    }

    fastify.decorate("repo", repo);
}

export default fp(repoInit, {
    dependencies: ['db'],
    name: "repo",
});