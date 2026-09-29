import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const root=process.cwd(), app=root+'/apps/pfotentechnik', out=root+'/reports/editorial-leakage-35.3/validation';
const commands=['audit:editorial-leakage','audit:editorial-transparency','audit:technical-seo','audit:url-consistency:strict','audit:release-build-output:strict','audit:internal-links:strict','audit:internal-link-targets:strict','audit:internal-link-health:strict','audit:comparison-schema','audit:products:strict','audit:product-standard-3:strict','audit:product-evidence','price:audit:strict','audit:image-alt:strict','design-system:contrast:audit','design-system:responsive:audit','audit:performance:strict','audit:frontmatter-dates:strict'];
const results=[];
for(const command of commands){const log=out+'/'+command.replaceAll(':','-')+'.log';const fd=fs.openSync(log,'w');const t=Date.now();const r=spawnSync('npm',['run',command],{cwd:app,stdio:['ignore',fd,fd],timeout:180000});fs.closeSync(fd);results.push({command,exitCode:r.status,error:r.error?.message,durationMs:Date.now()-t,log});fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log(command,r.status);}
