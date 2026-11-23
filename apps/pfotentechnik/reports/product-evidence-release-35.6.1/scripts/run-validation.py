"""Run the selected release candidate, keeping output in this report directory."""
import datetime,json,pathlib,subprocess,sys
P=pathlib.Path(__file__).resolve().parents[1]
REPO=pathlib.Path(sys.argv[1]).resolve()
commands=[
('app-tests',['npm','--workspace','apps/pfotentechnik','test']),
('core-tests',['npm','run','test:affiliate']),
('evidence-tests',['node','--test','apps/pfotentechnik/test/editorial-evidence-update-35.6.test.mjs','apps/pfotentechnik/test/product-evidence-release-35.6.1.test.mjs']),
('editorial-lint',['npm','--workspace','apps/pfotentechnik','run','lint:content:strict']),
('content-quality',['node','apps/pfotentechnik/scripts/content-quality/audit.mjs','--strict']),
('url-consistency',['node','apps/pfotentechnik/scripts/seo/audit-url-consistency.mjs','--strict']),
('build-output',['node','apps/pfotentechnik/scripts/seo/audit-release-build-output.mjs','--strict']),
('internal-links',['node','scripts/audit-internal-links.mjs','--strict']),
('internal-targets',['node','apps/pfotentechnik/scripts/audit-internal-link-targets.mjs','--strict']),
('schema',['node','apps/pfotentechnik/scripts/seo/audit-comparison-product-schema.mjs']),
('products',['node','apps/pfotentechnik/scripts/audit-product-data.mjs','--strict']),
('operations',['node','apps/pfotentechnik/scripts/product-operations/audit.mjs','--strict']),
('product-standard',['node','apps/pfotentechnik/scripts/product-standard-3/audit.mjs','--strict']),
('scores',['node','scripts/audit-pfotentechnik-product-scores.mjs']),
('ratings',['npm','run','ratings:check']),
('findings',['node','apps/pfotentechnik/scripts/product-evidence/check-findings.mjs']),
('experiment',['node','apps/pfotentechnik/scripts/indexation/verify.mjs']),
('decision-facts',['node','apps/pfotentechnik/scripts/product-experience/audit-decision-facts.mjs','--check']),
]
results=[]
for name,cmd in commands:
 with (P/'logs'/f'{name}.log').open('w') as out:r=subprocess.run(cmd,cwd=REPO,stdout=out,stderr=subprocess.STDOUT)
 results.append(dict(name=name,command=cmd,cwd=str(REPO),exitCode=r.returncode));print(name,r.returncode,flush=True)
(P/'validation-commands.json').write_text(json.dumps(dict(checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),candidateRoot=str(REPO),results=results),indent=2)+'\n')
