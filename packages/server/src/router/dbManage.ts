import type {FastifyInstance} from "fastify";
import multipart from "@fastify/multipart"
import {nanoid} from "nanoid";
import sharp from "sharp";
import fs from "fs";
import path from "node:path";
import {rootPath} from "../server.js";
import {pipeline} from "stream/promises";
import {AnimeData} from "@anime/shared";
async function dbManageRouterInit(fastify: FastifyInstance) {
    fastify.register(multipart);

    /**
     * 动画上传接口，用于新增动画。
     * 图片被缩小为长边1000px的webp格式并存储于public/poster目录下，文本字段解析后插入数据库
     * 使用Zod进行校验，校验失败后回滚图片
     * @route POST
     * @consumes multipart/form-data
     * @returns {Promise<void>}
     * @example Success Response (200)
     * //{"status": "Success", "message": "Insert Anime Success!"}
     * @example Error Response (400)
     * //{"status": "Error", "message": "Invalid Input Data"}
     */
    fastify.post("/", async (request, reply) => {
        const animeId = nanoid(12);
        const parts = request.parts();

        let savePath = "";
        let formData:any = {};
        //Stage.1 解析并处理数据
        for await (const part of parts) {
            if(part.type === "file"){
                savePath = path.join(rootPath, `public/posters/${animeId}.webp`);
                const outStream = fs.createWriteStream(savePath);
                const transformer = sharp().resize({
                    width: 1000,
                    height: 1000,
                    fit:"outside",
                    withoutEnlargement:true //仅缩小
                }).webp({
                    quality: 90
                })
                await pipeline(part.file, transformer, outStream);
            } else {
                formData[part.fieldname] = part.value;
            }
        }
        //Stage.2 校验数据合理性
        const safeData = AnimeData.omit({id: true}).strict().safeParse(formData);
        if(!safeData.success) {
            // 数据不合法时需回滚已保存的图片
            if(savePath) await fs.promises.unlink(savePath);
            reply.code(400).send({
                status: "Error",
                message: "Invalid Input Data"
            })
            return
        }
        //Stage.3 插入数据
        //await fastify.repo.insert(safeData.data, animeId);
        reply.code(200).send({
            status: "Success",
            message: "Insert Anime Success!"
        })
        return
    })

}