import {Pool} from "pg";
import type { AnimeDataSchema } from "@anime/shared";

export abstract class Repository<T> {
    protected db: Pool;
    protected constructor(db:Pool) {
        this.db = db
    }
    protected abstract creatTable() : Promise<string>;
    protected abstract insert(data:T, id:string) : Promise<string>;
    protected logs(text:string){
        console.log(text); //后续切换为正经的log插件
    }
    protected async query(text:string, data:T){
        const params: any[] = [];
        //捕获所有$name 形式的具名参数，然后替换并将对象中的参数解析到数组中，构建nodepg形式的查询语句
        const parsedText = text.replace(/\$([a-zA-Z0-9_]+)/g
            ,(match, paramName: keyof T) => {
            const actualValue = data[paramName];
            const length = params.push(actualValue);
            return `$${length}`;
        });
        return await this.db.query(parsedText, params);
    }
}