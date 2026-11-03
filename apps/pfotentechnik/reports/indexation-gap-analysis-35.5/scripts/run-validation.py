import subprocess,json,datetime
from pathlib import Path
P=Path('apps/pfotentechnik/reports/indexation-gap-analysis-35.5');(P/'logs').mkdir(exist_ok=True)
commands=[('app-tests',['npm','--workspace','apps/pfotentechnik','test']),('core-tests',['npm','run','test:affiliate']),('content-quality',['node','apps/pfotentechnik/scripts/content-quality/audit.mjs','--strict']),('editorial-lint',['npm','--workspace','apps/pfotentechnik','run','lint:content:strict']),('url-consistency',['node','apps/pfotentechnik/scripts/seo/audit-url-consistency.mjs','--strict']),('build-output',['node','apps/pfotentechnik/scripts/seo/audit-release-build-output.mjs','--strict']),('internal-links',['node','scripts/audit-internal-links.mjs','--strict']),('internal-targets',['node','apps/pfotentechnik/scripts/audit-internal-link-targets.mjs','--strict']),('comparison-schema',['node','apps/pfotentechnik/scripts/seo/audit-comparison-product-schema.mjs']),('editorial-transparency',['node','apps/pfotentechnik/scripts/audit-editorial-transparency.mjs'])]
results=[]
for name,cmd in commands:
 with (P/'logs'/(name+'.log')).open('w') as f:r=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT)
 results.append(dict(name=name,command=cmd,exitCode=r.returncode));print(name,r.returncode,flush=True)
(P/'validation-commands.json').write_text(json.dumps(dict(checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),results=results),indent=2))
