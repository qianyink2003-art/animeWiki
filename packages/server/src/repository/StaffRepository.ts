import {Repository} from "./Repository.js";
import {type StaffSchema, Staff} from "@anime/shared";
import type {Pool, PoolClient} from "pg";
import * as z from "zod";

//staff 信息对应的数据实体
type Item = StaffSchema & {animeId:string};

/**
 * staff 信息的 Repository 类
 */
export default class StaffRepository extends Repository<Item>{
    private readonly tableName: string;
    private readonly relationTableName: string;
    constructor(db:Pool) {
        super(db);
        this.tableName = "staffInfo"
        this.relationTableName = "relationStaffAnime"
    }
    /**
     * 插入方法，向关系表中插入数据并按需向 staff 表插入数据
     * @param data
     * @param externalClient 透传外部 Client，用于事务中调用
     * @returns Promise<void>
     */
    public async insert(data:Item[], externalClient?:PoolClient){
        //Stage.1 数据校验与清洗，防止恶意数据
        const safeData = z.array(Staff.extend({
            animeId:z.string()
        }).strict()).parse(data);

        //Stage.2 多行数据批量插入
        const insertRelationSql = `
            INSERT INTO ${this.relationTableName} (role, animeId, staffBgmId) 
            VALUES %L
            ON CONFLICT (role, animeId, staffBgmId) DO NOTHING`

        const insertStaffInfoSql = `
            INSERT INTO ${this.tableName} (staffBgmId, staffName) 
            VALUES %L
            ON CONFLICT (staffBgmId) DO NOTHING`

        await this.query(insertStaffInfoSql, safeData, externalClient);
        await this.query(insertRelationSql, safeData, externalClient);
    }

    /**
     * 用于新建 staffInfo 与 relationStaffAnime 表
     */
    public async createTable(externalClient?:PoolClient){
        const executor = externalClient || this.db;
        await executor.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
            staffBgmId TEXT PRIMARY KEY, --用 bgmId 作为主键，方便管理
            staffName TEXT)
            `);
        await executor.query(`
        CREATE TABLE IF NOT EXISTS ${this.relationTableName} (
            id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            role TEXT NOT NULL, --职位信息
            staffBgmId TEXT NOT NULL,
            animeId TEXT NOT NULL,
            CONSTRAINT fk_role_anime FOREIGN KEY (animeId) REFERENCES basicInfo(id),
            CONSTRAINT fk_role_staff FOREIGN KEY (staffBgmId) REFERENCES staffInfo(staffBgmId),
            CONSTRAINT unique_anime_staff_role UNIQUE (animeId, staffBgmId, role)
        );
        CREATE INDEX IF NOT EXISTS idx_relation_anime_staff_animeId ON ${this.relationTableName}(animeId);
        CREATE INDEX IF NOT EXISTS idx_relation_anime_staff_staffBgmId ON ${this.relationTableName}(staffBgmId);
        `)
    }
}