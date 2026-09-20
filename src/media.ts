import type { PageKey, TaskType } from './store'
export type Scene = { image:string; video?:string; kicker:string; caption:string }
const root='./media/glass/'
export const SCENES: Record<PageKey,Scene> = {
 dashboard:{image:root+'hero-field.jpg',kicker:'A LIVING LANDSCAPE',caption:'让自然的生长，看得见。'},
 tasks:{image:root+'field-corn.jpg',video:'./media/field.mp4',kicker:'FIELD OPERATIONS',caption:'每一项农事，都走向丰收。'},
 soil:{image:root+'soil.jpg',video:root+'soil.mp4',kicker:'BENEATH THE SURFACE',caption:'从土壤深处，读懂生长。'},
 history:{image:root+'leaf.jpg',video:root+'leaf.mp4',kicker:'TRACES OF GROWTH',caption:'让时间，留下生长的答案。'},
 alerts:{image:root+'leaf-disease.jpg',kicker:'CARE IN EVERY DETAIL',caption:'在细微之处，看见田间变化。'},
 inspection:{image:root+'rover.jpg',video:root+'rover.mp4',kicker:'INTELLIGENCE IN MOTION',caption:'穿行田垄，守护每一次生长。'},
 harvest:{image:root+'field-wheat.jpg',kicker:'THE GOLDEN MOMENT',caption:'把成熟的美好，留在此刻。'},
 crops:{image:root+'field-soy.jpg',video:root+'leaf.mp4',kicker:'ROOTED IN NATURE',caption:'从萌芽，到满眼生机。'},
 map:{image:root+'hero-field.jpg',kicker:'A WIDER PERSPECTIVE',caption:'一片田野，一张生长地图。'},
 devices:{image:root+'rover-real.jpg',kicker:'CONNECTED TO THE FIELD',caption:'连接土地与数据的每一刻。'},
 analytics:{image:root+'field-wheat.jpg',kicker:'INSIGHT THAT GROWS',caption:'在数据中，看见丰收的轮廓。'},
 inventory:{image:root+'field-corn.jpg',kicker:'READY FOR THE SEASON',caption:'让每一份准备，恰到好处。'},
 team:{image:root+'hero-field.jpg',kicker:'GROWING TOGETHER',caption:'与同路人，共赴好收成。'},
 settings:{image:root+'leaf.jpg',kicker:'YOUR FARM, YOUR WAY',caption:'让智慧农场，与你默契相连。'},
}
export const CROP_IMAGES:Record<string,string>={A1:root+'hero-field.jpg',A2:root+'field-corn.jpg',B1:root+'field-soy.jpg',B2:root+'leaf.jpg',C1:root+'field-wheat.jpg'}
export const TASK_IMAGES:Record<TaskType,string>={'日常任务':root+'field-corn.jpg','灌溉施肥':root+'leaf.jpg','会议':root+'hero-field.jpg','植保':root+'leaf-disease.jpg','采收':root+'field-wheat.jpg','农机':root+'rover.jpg'}
