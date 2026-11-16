import fs from 'node:fs';
import {resolveDataFile} from './loadDashboard.ts';
export function loadIndexation(){
 const file=resolveDataFile('indexation-dashboard.json');
 if(!fs.existsSync(file))return null;
 const value=JSON.parse(fs.readFileSync(file,'utf8'));
 if(value.version!=='36.1'||!Array.isArray(value.rows))throw Error('Ungültige Indexierungsdaten; report:indexation ausführen.');
 return value;
}
