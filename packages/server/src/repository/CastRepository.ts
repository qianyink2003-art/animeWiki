import {Repository} from "./Repository.js";
import * as z from "zod"
import {type CastSchema, Cast, Staff} from "@anime/shared";
import type {Pool, PoolClient} from "pg";

//CastInfo对应的数据实体
type Item = CastSchema & {animeId: string}

/**
 * Cast 信息的 Repository 类
 */
export default class CastRepository extends Repository<Item>{
    private readonly tableName: string
    private readonly relationTableName: string
    constructor(db:Pool) {
        super(db);
        this.tableName = "castInfo";
        this.relationTableName = "relationCastAnime";
    }

    /**
     * 向 CastInfo 与 relationCastAnime 中加入一行新数据
     * @param data
     * @param externalClient 透传外部Client，用于事务中调用
     * @returns Promise<void>
     */
    public async insert(data: Item[], externalClient?:PoolClient) {
        // Stage.1 数据检查, 数据不合法时抛出异常
        const safeData = z.array(Cast.extend({
            animeId: z.string()
        }).strict()).parse(data);
        // Stage.2 动态构建 sql 语句并执行
        const insertStaffInfoSql = `
            INSERT INTO ${this.tableName} (castBgmId, castName) 
            VALUES %L 
            ON CONFLICT (castBgmId) DO NOTHING`
        const insertRelationSql = `
            INSERT INTO ${this.relationTableName} (characterBgmId, characterName, animeId, castBgmId) 
            VALUES %L 
            ON CONFLICT (characterBgmId)  DO NOTHING`

        await this.query(insertStaffInfoSql, safeData, externalClient);
        await this.query(insertRelationSql, safeData, externalClient);
    }

    /**
     * 建立 CastInfo 与 relationCastAnime 表
     * @param externalClient 透传外部 Client, 用于事务中调用
     * @returns Promise<void>
     */
    public async createTable(externalClient?:PoolClient) {
        const executor = externalClient || this.db;
        await executor.query(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                castBgmId TEXT PRIMARY KEY, --利用 bgmId 作为唯一标识符
                castName TEXT NOT NULL)
        `);

        await executor.query(`
        CREATE TABLE IF NOT EXISTS ${this.relationTableName} (
            characterBgmId TEXT PRIMARY KEY, --角色为关系信息, 利用 bgmId 作为唯一标识符
            characterName TEXT NOT NULL,
            animeId TEXT NOT NULL,
            castBgmId TEXT NOT NULL,
            CONSTRAINT fk_character_anime FOREIGN KEY (animeId) REFERENCES basicInfo(id),
            CONSTRAINT fk_character_cast FOREIGN KEY (castBgmId) REFERENCES castInfo(castBgmId),
            CONSTRAINT unique_anime_cast_rol unique (characterName, animeId, castBgmId));
            CREATE INDEX IF NOT EXISTS idx_relation_cast_anime_animeId ON ${this.relationTableName} (animeId);
            CREATE INDEX IF NOT EXISTS idx_relation_cast_anime_castBgmId ON ${this.relationTableName} (castBgmId);
        `);
    }
}