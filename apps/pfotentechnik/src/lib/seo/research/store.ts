import fs from "node:fs"; import path from "node:path"; import type {ResearchItem,ResearchStore} from "./schema";
const EMPTY:ResearchStore={version:1,updatedAt:null,provider:"manual-chatgpt",scope:[],items:[]};
const root=()=>process.cwd().endsWith(path.join("apps","pfotentechnik"))?process.cwd():path.join(process.cwd(),"apps","pfotentechnik");
export const researchStorePath=()=>path.join(root(),"research","research.json");
export const loadResearchStore=():ResearchStore=>{const file=researchStorePath();if(!fs.existsSync(file))return EMPTY;try{const p=JSON.parse(fs.readFileSync(file,"utf8"));return {...EMPTY,...p,scope:Array.isArray(p.scope)?p.scope:[],items:Array.isArray(p.items)?p.items:[]};}catch{return EMPTY;}};
export const getOpenResearchItems=():ResearchItem[]=>loadResearchStore().items.filter(i=>i.status==="open"||i.status==="planned").sort((a,b)=>b.priority-a.priority||b.confidence-a.confidence);
