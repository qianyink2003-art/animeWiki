import * as z from 'zod'

export enum ChannelName {
    Baha=0,
    NF=1,
    Disney=2,
    Amazon=3,
    CR=4,
    TV=5,
}

export enum Category {
    movie=0,
    tv=1,
    ova=2,
    network=3,
    other=4,
}

export enum Adapt {
    origin=0,
    comic=1,
    novel=2,
    game=3,
    other=4,
}

export enum Season {
    Winter=0,
    Spring=1,
    Summer=2,
    Autumn=3,
    Unknown=4,
}
export enum Weekday {
    Monday=1,
    Tuesday=2,
    Wednesday=3,
    Thursday=4,
    Friday=5,
    Saturday=6,
    Sunday=7,
}

const Program = z.object({
    animeID: z.nanoid(),
    description: z.string(),
    channel: z.enum(ChannelName),
    logicDate: z.string(),
    logicTime: z.string(),
    episode: z.number(),
    isBroadcasted: z.boolean(),
});
export type ProgramSchema = z.infer<typeof Program>;

const Schedule = z.object({
    year: z.int(),
    season: z.enum(Season),
    weekday: z.enum(Weekday).optional(),
    logicDate: z.string().optional(),
    logicTime: z.string().optional(),
    description: z.string().optional(),
    totalEpisode: z.int().optional(),
})
export type ScheduleSchema = z.infer<typeof Schedule>;

const Staff = z.object({
    castBgmID: z.string(),
    castName: z.string(),
    characterBgmId: z.string(),
    characterName: z.string(),
});
export type StaffSchema = z.infer<typeof Staff>;

const Cast = z.object({
    castBgmID: z.string(),
    castName: z.string(),
    characterBgmId: z.string(),
    characterName: z.string(),
});
export type CastSchema = z.infer<typeof Cast>;

const Music = z.object({
    description: z.string(),
    qqID: z.string(),
});
export type MusicSchema = z.infer<typeof Music>;

const AnimeData  = z.object({
    id: z.nanoid(),
    title: z.string(),
    jpTitle: z.string(),
    category: z.enum(Category),
    adapt: z.enum(Adapt),
    schedule: z.array(Schedule),
    isFinished: z.boolean(),

    officialWeb: z.url().optional(),
    bgmID: z.string().optional(),
    PV: z.url().optional(),
    cast: z.array(Cast).optional(),
    staff: z.array(Staff).optional(),
    music: z.array(Music).optional()
})
export type AnimeDataSchema = z.infer<typeof AnimeData>;