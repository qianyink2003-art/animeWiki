import BasicRepository from "../repository/BasicRepository.js";
import CastRepository from "../repository/CastRepository.js";
import ScheduleRepository from "../repository/ScheduleRepository.js";
import StaffRepository from "../repository/StaffRepository.js";
import * as z from "zod";
import type {Pool, PoolClient} from "pg";
import {AnimeData,type AnimeDataSchema} from "@anime/shared";

/**
 * 所有数据库操作的外部封装类, 只暴露必要的接口
 */
export default class AniDb {

    private readonly db:Pool;
    private basic: BasicRepository;
    private schedule: ScheduleRepository;
    private staff: StaffRepository;
    private cast: CastRepository;

    constructor(db:Pool) {
        this.db = db;
        this.basic = new BasicRepository(this.db);
        this.schedule = new ScheduleRepository(this.db);
        this.staff = new StaffRepository(this.db);
        this.cast = new CastRepository(this.db);
    }

    /**
     * 利用事务初始化所以数据表
     */
    public async createTable(){
        const client = this.db.connect();
        await this.transaction(async (client) => {
            await this.basic.createTable(client);
            await this.schedule.createTable(client);
            await this.staff.createTable(client);
            await this.cast.createTable(client);
        })
    }

    /**
     * 新增一条动画信息
     * @param data
     * @param id nanoid(12) 动画的唯一标识符
     * @returns Promise<string> 返回插入后的 id
     */
    public async add(data: Omit<AnimeDataSchema, "id">, id:string){
        // Stage.1 数据校验与处理
        const safeData = AnimeData.omit({id:true}).strict().parse(data);
        const {cast, staff, schedule, musicList, channelList,...basic} = safeData;
        //预处理数据使其符合 Repository 类要求
        const processedCast =
            cast.map((item) => {return {animeId:id, ...item}});
        const processedStaff =
            staff.map((item) => {return {animeId:id, ...item}});
        const processedSchedule =
            schedule.map((item) => {return {animeId:id, ...item}});
        // Stage.2 构建事物执行插入
        await this.transaction(async (client) => {
            await this.basic.insert({
                id: id,
                musicList:musicList,
                channelList:channelList,
                ...basic,
            },client);
            await this.schedule.insert(processedSchedule, client);
            if(processedStaff.length !== 0) await this.staff.insert(processedStaff, client);
            if(processedCast.length !== 0) await this.cast.insert(processedCast, client);
        })
        return id;
    }

    /**
     * 事务包装方法, 用于创建事务
     * @param callback 事务中需要执行的函数
     * @protected
     */
    protected async transaction(callback:(client:PoolClient) => Promise<void>){
        const client = await this.db.connect();
        try{
            await client.query(`BEGIN`);
            await callback(client);
            await client.query(`COMMIT`);
        }catch(err){
            await client.query(`ROLLBACK`);
            throw new Error(`Transaction failed ${err}`);
        }finally{
            //确保事务结束后连接被释放
            client.release();
        }
        return "Transaction success"
    }
}