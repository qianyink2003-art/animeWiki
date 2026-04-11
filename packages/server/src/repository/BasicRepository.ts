import {Repository} from "./Repository.js";
import type {Pool} from "pg";
import type {BasicDataSchema} from "@anime/shared";
import {BasicData} from "@anime/shared";

export default class BasicRepository extends Repository<BasicDataSchema & {id:string}>{
    public readonly tableName:string
    constructor(db:Pool) {
        super(db);
        this.tableName = "basicInfo";
    }
    public async insert(data:BasicDataSchema, id:string): Promise<string> {
        const safeData = BasicData.safeParse(data);
        if(!safeData.success){
            console.error("Invalidate Data Input In BasicInfo Insert", safeData.error);
            return "Invalidate Input"
        }
        const text = `
            INSERT INTO ${this.tableName}
            (id, title, jpTitle, cate, adapt, officialWeb, bgmID, PV)
            VALUES ($id, $title, $jpTitle, $cate, $adapt, $officialWeb, $bgmID, $PV)
            `;
        const result = await this.query(text, {
            ...safeData.data,
            id
        });
        return ""
    }
    public async creatTable():Promise<string> {
        await this.db.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName}(
        id TEXT PRIMARY KEY, --动画的唯一标识符
        title TEXT NOT NULL,  --动画的中文标题
        jpTitle TEXT NOT NULL,  --动画的日文标题
        cate INT NOT NULL,  --动画的分类，用于区分tv, ova等。与接口命名不同是因为category为保留字
        adapt INT NOT NULL,  --动画的改编情况
        officialWeb TEXT, --动画的官网，可以为空
        bgmID TEXT,  --bangumiID，可以为空
        PV TEXT)  --PV链接，可以为空
        `)
        return `${this.tableName}创建成功`;
    }
}