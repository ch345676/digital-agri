export type Feedback = {id:string; message:string; progress?:number; error?:boolean}
export function feedback(message:string, options:Partial<Feedback>={}) {const item={id:crypto.randomUUID(),message,...options}; window.dispatchEvent(new CustomEvent('huinong-feedback',{detail:item}));return item.id}
export type SaveState = {ok:boolean; time:string}
let saved:SaveState|null=null
export function getSaveState(){return saved}
export function reportSave(ok:boolean){saved={ok,time:new Date().toLocaleTimeString('zh-CN',{hour12:false})};window.dispatchEvent(new Event('huinong-save'))}
