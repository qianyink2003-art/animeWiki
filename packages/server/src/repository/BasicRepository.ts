import {Repository} from "./Repository.js";
import type {Pool, PoolClient} from "pg";
import type {BasicDataSchema, MusicSchema} from "@anime/shared";
import {BasicData} from "@anime/shared";
import * as z from "zod";

//BasicInfo对应的数据实体
type Item = BasicDataSchema & {
    id:string,
}
/**
 * Basic 信息的 Repository 类
 */
export default class BasicRepository extends Repository<Item>{
    public readonly tableName:string;
    constructor(db:Pool) {
        super(db);
        this.tableName = "basicInfo";
    }
    /**
     * 向 basicInfo 中插入一条数据
     * @param data 要插入的数据，该数据完整匹配 Item 类
     * @param externalClient 透传外部 Client, 用于 transaction
     * @returns Promise<void>
     */
    public async insert(data:Item, externalClient?:PoolClient){
        //Stage.1 数据校验
        const safeData = BasicData.extend({id:z.string()}).parse(data);

        //Stage.2 构建 sql 并插入数据
        let params:string[] = [];
        Object.keys(safeData).forEach((key:string) => {
            if(safeData[key as keyof Item]) params.push(`${key}`)
        })
        const text = `
            INSERT INTO ${this.tableName}
            ( ${params.join(", ")} )
            VALUES ( ${params.map((item) => `$${item}`).join(", ")} )
            `;
        await this.query(text, safeData, externalClient);
    }

    /**
     * 判断某一 id 的词条是否存在
     * @param id nanoid(12) 动画词条的唯一识别符
     * @returns Promise<boolean>
     */
    public async isExisted(id:string){
        return (await this.query(`SELECT 1 FROM ${this.tableName} WHERE (id) = $id`, {id})).rows.length > 0;
    }
    /**
     * 建表方法, 用于初次部署时自动化创建 basicInfo 数据表
     */
    public async createTable(externalClient?:PoolClient){
        const executor = externalClient || this.db;
        await executor.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY, --动画的唯一标识符
        title TEXT NOT NULL,  --动画的中文标题
        jpTitle TEXT NOT NULL,  --动画的日文标题
        cate INT NOT NULL,  --动画的分类，用于区分tv, ova等。与接口命名不同是因为category为保留字
        adapt INT NOT NULL,  --动画的改编情况
        officialWeb TEXT, --动画的官网，可以为空
        bgmID TEXT,  --bangumiID，可以为空
        PV TEXT,  --PV链接，可以为空
        musicList JSONB NOT NULL DEFAULT '[]'::jsonb,
        channelList JSONB NOT NULL DEFAULT '[]'::jsonb)  
        `)
    }
}