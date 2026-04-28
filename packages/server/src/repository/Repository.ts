import {Pool, type PoolClient} from "pg";
import * as z from "zod"

/**
 * Repository 类的抽象基类, 定义通用方法
 */
export abstract class Repository<T extends object> {
    protected db: Pool;
    protected constructor(db:Pool) {
        this.db = db
    }
    protected abstract createTable() : Promise<void>;
    protected abstract insert(data:T|T[], externalClient?:PoolClient) : Promise<void>;
    protected logs(text:string){
        console.log(text); //后续切换为正经的log插件
    }

    /**
     * 将具名表达式构建为 node-pg 形式的 SQL 表达式并执行，返回执行结果。
     * @param text 具名表达式文本
     * @param data 具名表达式的数据对象
     * @param runner 透传外部 Client, 用于外部事务调用
     * @protected
     * @returns QueryResult 使用 rows 获取查询结果
     */
    protected async query(text:string, data:Partial<T>|Partial<T>[], runner?:PoolClient){

        const querySql = Array.isArray(data)? this.buildBulkPgSql(text, data):this.buildPgSql(text,data)
        const executor = runner || this.db;
        console.log(`Executing query ${querySql.sql}`);
        return await executor.query(querySql.sql, querySql.data);
    }

    /**
     * 将具名表达式转换为 node-pg 形式
     * @param text 具名表达式文本
     * @param data 具名表达式对应的数据对象
     * @protected
     */
    protected buildPgSql(text:string,data:Partial<T>){
        const params: any[] = [];
        //核心逻辑, 提取$param 形式的文本并替换为$1, 同时将对应属性压入数组
        const parsedText = text.replace(/\$([a-zA-Z0-9_]+)/g
            ,(match, paramName) => {
                const actualValue = data[paramName as keyof T];
                const length = params.push(actualValue);
                return `$${length}`;
            });
        return {
            sql: parsedText,
            data: params
        };
    }

    /**
     * 动态解析生成批量插入语句，有且仅有插入语句才可用
     * @param text 待解析的表达式 格式为：INSERT INTO table () VALUES %L  同时参数表按最大参数输入
     * @param data 值的对象数组，注意对象键名要与列名相同
     * @returns object
     * {
     *      sql: 解析后的 sql 文本,
     *      data: 解析后的数组数据
     * }
     */
    public buildBulkPgSql(text:string,data:Partial<T>[]){
        //匹配形如(col1, col2)的字段, 用于识别传入的列类型
        const params = text.match(/\(([a-zA-Z0-9\s,]+)\)/)?.[1]?.split(/[,\s]+/)??[];

        if(!params.length) throw new Error(`${text} is not a valid key.`);
        let processedData:any[] = [];
        let paramIndex:string[] = [];

        for(let i=0,j = 0; i < data.length;){
            processedData.push(data[i]?.[params[j] as keyof T]??null);
            paramIndex.push(`$${i*params.length + j + 1}`);
            if((j+1)%params.length == 0){i+=1;j=0}else{j+=1}
        }

        let result:string[] = [];
        for(let i=0;i<paramIndex.length;i+=params.length){
            result.push(paramIndex.slice(i,i+params.length).join(", "));
        }
        const parsedText = text.replace(/%L/, `(${result.join("), (")})`)
        return {
            sql: parsedText,
            data: processedData
        }
    }
}