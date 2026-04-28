import {Repository} from "./Repository.js";
import {type ScheduleSchema, Schedule} from "@anime/shared";
import type {Pool, PoolClient} from "pg";
import * as z from "zod";
// ScheduleInfo 对应的数据实体
type Item = ScheduleSchema & {animeId:string}
/**
 * schedule 信息的 Repository 类
 */
export default class ScheduleRepository extends Repository<Item>{
    public readonly schemaName:string
    constructor(db:Pool) {
        super(db);
        this.schemaName="scheduleInfo";
    }

    /**
     * 向 scheduleInfo 中插入一条数据
     * @param data 要插入的数据，该数据完整匹配 Item 类
     * @param externalClient 透传外部客户端, 用于 transaction
     * @returns Promise<void>
     */
    public async insert(data:Item[], externalClient?:PoolClient){
        //Stage.1 校验数据以防恶意注入
        const safeData = z.array(Schedule.extend({
            animeId: z.string()
        }).strict()).parse(data);
        //Stage.2 插入数据
        const text = `
        INSERT INTO ${this.schemaName}
        (year, season, weekday, logicDate, logicTime, description, totalEpisode, isFinished, animeId)
        VALUES %L
        `
        await this.query(text, safeData, externalClient);
    }

    /**
     * 建立 scheduleInfo 表
     * @param externalClient 透传外部 Client, 用于事务中调用
     */
    public async createTable(externalClient?:PoolClient){
        const executor = externalClient || this.db;
        await executor.query(`
        CREATE TABLE IF NOT EXISTS ${this.schemaName} (
            id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, --自增数字 id
            year INT NOT NULL, --动画播出年份
            season INT NOT NULL, --动画播出的季度, 与 Season enum 对应
            weekday INT, --动画播出的周天, 与 Weekday enum 对应
            logicDate DATE, --动画播出的 30h 逻辑日期
            logicTime TEXT, --动画播出的 30h 逻辑时间
            description TEXT, --描述本期动画的放送信息
            totalEpisode INT, --本期放送的总集数
            isFinished BOOLEAN NOT NULL DEFAULT false, --是否完结
            animeId TEXT NOT NULL, --外键,连接到 basicInfo 中的 id 列
            CONSTRAINT fk_schedule_anime FOREIGN KEY (animeId) REFERENCES basicInfo(id)
        );
        CREATE INDEX IF NOT EXISTS idx_schedule_year_season ON ${this.schemaName} (year, season);
        CREATE INDEX IF NOT EXISTS idx_schedule_animeId ON ${this.schemaName} (animeId);
        `)
    }
}