#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-topical-authority-roadmap-prompts-1.0.1";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runTests = !args.has("--no-tests");
const runBuild = args.has("--build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 14; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const PAGE = path.join(ROOT, "apps", "pfotentechnik", "src", "pages", "admin", "seo", "topical-authority.astro");
const MODULE = path.join(ROOT, "apps", "pfotentechnik", "src", "lib", "seo", "topical-authority", "roadmap-prompts.ts");
const TEST = path.join(ROOT, "apps", "pfotentechnik", "test", "topical-authority-roadmap-prompts-1.0.1.test.mjs");

const moduleContent = Buffer.from("aW1wb3J0IHsKICBidWlsZENoYXRHcHRQcm9tcHQsCiAgYnVpbGRDb2RleFByb21wdCwKfSBmcm9tICIuLi8uLi9zZW8tY29waWxvdC9wcm9tcHRzLnRzIjsKaW1wb3J0IHR5cGUgeyBQcm9tcHRLaW5kIH0gZnJvbSAiLi4vLi4vc2VvLWNvcGlsb3QvdHlwZXMudHMiOwppbXBvcnQgdHlwZSB7IFByb21wdFRlbXBsYXRlSWQgfSBmcm9tICIuLi8uLi9zZW8tY29waWxvdC9wcm9tcHQtcmVnaXN0cnkudHMiOwppbXBvcnQgdHlwZSB7CiAgQ2x1c3RlciwKICBPcHBvcnR1bml0eSwKfSBmcm9tICIuL2xvYWRUb3BpY2FsQXV0aG9yaXR5LnRzIjsKCmV4cG9ydCBjb25zdCBUT1BJQ0FMX0FVVEhPUklUWV9ST0FETUFQX1BST01QVFNfVkVSU0lPTiA9ICIxLjAuMSI7Cgp0eXBlIFJvYWRtYXBQcm9tcHRQcm9maWxlID0gewogIGtpbmQ6IFByb21wdEtpbmQ7CiAgdGVtcGxhdGVJZDogUHJvbXB0VGVtcGxhdGVJZDsKICBtb2RlOiAiY29uc29saWRhdGUiIHwgImpvdXJuZXkiIHwgImV4cGFuZCIgfCAidmFsaWRhdGUiOwp9OwoKZXhwb3J0IHR5cGUgVG9waWNhbEF1dGhvcml0eVJvYWRtYXBQcm9tcHRQYWlyID0gewogIGNoYXRncHQ6IHN0cmluZzsKICBjb2RleDogc3RyaW5nOwp9OwoKY29uc3QgcHJvZmlsZUZvck9wcG9ydHVuaXR5ID0gKAogIG9wcG9ydHVuaXR5OiBPcHBvcnR1bml0eSwKKTogUm9hZG1hcFByb21wdFByb2ZpbGUgPT4gewogIGlmIChvcHBvcnR1bml0eS5pZC5zdGFydHNXaXRoKCJsaW5rLSIpKSB7CiAgICByZXR1cm4gewogICAgICBraW5kOiAiaW50ZXJuYWwtbGluayIsCiAgICAgIHRlbXBsYXRlSWQ6ICJpbnRlcm5hbC1saW5raW5nLWltcHJvdmUiLAogICAgICBtb2RlOiAiam91cm5leSIsCiAgICB9OwogIH0KCiAgaWYgKG9wcG9ydHVuaXR5LmlkLnN0YXJ0c1dpdGgoInZhbGlkYXRlLSIpKSB7CiAgICByZXR1cm4gewogICAgICBraW5kOiAibmljaGUtb3Bwb3J0dW5pdHkiLAogICAgICB0ZW1wbGF0ZUlkOiAidmFsaWRhdGUtbmljaGUiLAogICAgICBtb2RlOiAidmFsaWRhdGUiLAogICAgfTsKICB9CgogIGlmICgvY29uc29saWRhdGV8a29uc29saWRpZXIvaS50ZXN0KG9wcG9ydHVuaXR5LmlkICsgb3Bwb3J0dW5pdHkudGl0bGUpKSB7CiAgICByZXR1cm4gewogICAgICBraW5kOiAiY29udGVudC1nYXAiLAogICAgICB0ZW1wbGF0ZUlkOiAiY2xvc2UtY29udGVudC1nYXAiLAogICAgICBtb2RlOiAiY29uc29saWRhdGUiLAogICAgfTsKICB9CgogIGlmICgvY29tbWVyY2lhbHxqb3VybmV5fGthdWZuYWgvaS50ZXN0KG9wcG9ydHVuaXR5LmlkICsgb3Bwb3J0dW5pdHkudGl0bGUpKSB7CiAgICByZXR1cm4gewogICAgICBraW5kOiAiZGVjaXNpb24tam91cm5leSIsCiAgICAgIHRlbXBsYXRlSWQ6ICJkZWNpc2lvbi1qb3VybmV5IiwKICAgICAgbW9kZTogImpvdXJuZXkiLAogICAgfTsKICB9CgogIHJldHVybiB7CiAgICBraW5kOiAiY29udGVudC1nYXAiLAogICAgdGVtcGxhdGVJZDogInBsYW4tdG9waWMtY2x1c3RlciIsCiAgICBtb2RlOiAiZXhwYW5kIiwKICB9Owp9OwoKY29uc3QgbGlzdERvY3VtZW50cyA9ICgKICBjbHVzdGVyOiBDbHVzdGVyIHwgdW5kZWZpbmVkLAogIHR5cGU/OiBDbHVzdGVyWyJkb2N1bWVudHMiXVtudW1iZXJdWyJ0eXBlIl0sCik6IHN0cmluZ1tdID0+CiAgKGNsdXN0ZXI/LmRvY3VtZW50cyA/PyBbXSkKICAgIC5maWx0ZXIoKGRvY3VtZW50KSA9PiAhdHlwZSB8fCBkb2N1bWVudC50eXBlID09PSB0eXBlKQogICAgLm1hcCgoZG9jdW1lbnQpID0+IGAke2RvY3VtZW50LnRpdGxlfSDigJMgJHtkb2N1bWVudC5yb3V0ZX1gKQogICAgLnNsaWNlKDAsIDMwKTsKCmNvbnN0IHJvYWRtYXBTcGVjaWZpY0NvbnRleHQgPSAoCiAgb3Bwb3J0dW5pdHk6IE9wcG9ydHVuaXR5LAogIGNsdXN0ZXI6IENsdXN0ZXIgfCB1bmRlZmluZWQsCikgPT4gewogIGNvbnN0IHByb2ZpbGUgPSBwcm9maWxlRm9yT3Bwb3J0dW5pdHkob3Bwb3J0dW5pdHkpOwogIGNvbnN0IGNsdXN0ZXJMYWJlbCA9IGNsdXN0ZXI/LmxhYmVsID8/IG9wcG9ydHVuaXR5LmNsdXN0ZXI7CiAgY29uc3QgZ2FwcyA9IGNsdXN0ZXI/LmdhcHMgPz8gW107CiAgY29uc3QgZG9jdW1lbnRzID0gbGlzdERvY3VtZW50cyhjbHVzdGVyKTsKCiAgY29uc3QgbW9kZVJ1bGU6IFJlY29yZDxSb2FkbWFwUHJvbXB0UHJvZmlsZVsibW9kZSJdLCBzdHJpbmc+ID0gewogICAgY29uc29saWRhdGU6CiAgICAgICJCZXN0ZWhlbmRlIEludGVudC1Pd25lciwgw5xiZXJzY2huZWlkdW5nZW4gdW5kIEthbm5pYmFsaXNpZXJ1bmdzcmlzaWtlbiB6dWVyc3Qga2zDpHJlbi4gS29uc29saWRpZXJlbiB1bmQgc2Now6RyZmVuIGhhdCBWb3JyYW5nIHZvciBuZXVlbiBTZWl0ZW4uIiwKICAgIGpvdXJuZXk6CiAgICAgICJEaWUgTnV0emVycmVpc2UgaW5uZXJoYWxiIGRlcyBDbHVzdGVycyBwcsO8ZmVuIHVuZCBudXIgZmFjaGxpY2ggbmF0w7xybGljaGUgw5xiZXJnw6RuZ2Ugendpc2NoZW4gSHViLCBSYXRnZWJlciwgVmVyZ2xlaWNoLCBQcm9kdWt0IHVuZCBIZXJzdGVsbGVyIGVyZ8Okbnplbi4iLAogICAgZXhwYW5kOgogICAgICAiTmV1ZSBTZWl0ZW4gbnVyIGJlaSBlaWdlbnN0w6RuZGlnZXIgU3VjaGludGVudGlvbiwga2xhcmVyIE51dHplcmF1ZmdhYmUgdW5kIG5hY2hnZXdpZXNlbmVtIEluZm9ybWF0aW9uIEdhaW4gdm9yc2VoZW4uIiwKICAgIHZhbGlkYXRlOgogICAgICAiWnVlcnN0IEdvL05vLUdvIGFuaGFuZCBzdHJhdGVnaXNjaGVyIE7DpGhlLCBiZWxhc3RiYXJlciBRdWVsbGVuLCBQcm9kdWt0YnJlaXRlLCBTaWNoZXJoZWl0IHVuZCBrb21tZXJ6aWVsbGVyIEVpZ251bmcgZW50c2NoZWlkZW4uIE9obmUgYmVsYXN0YmFyZSBHcnVuZGxhZ2UgbmljaHRzIGFubGVnZW4uIiwKICB9OwoKICByZXR1cm4gewogICAgcHJvZmlsZSwKICAgIGNsdXN0ZXJMYWJlbCwKICAgIGRvY3VtZW50cywKICAgIHByb2JsZW1zOiBbCiAgICAgIG9wcG9ydHVuaXR5LnJlYXNvbiwKICAgICAgLi4uZ2Fwcy5tYXAoKGdhcCkgPT4gYE9mZmVuZSBDbHVzdGVyLUzDvGNrZTogJHtnYXB9YCksCiAgICBdLAogICAgZXhpc3RpbmdEYXRhOiBbCiAgICAgIGBSb2FkbWFwLUNoYW5jZTogJHtvcHBvcnR1bml0eS50aXRsZX1gLAogICAgICBgQ2x1c3RlcjogJHtjbHVzdGVyTGFiZWx9YCwKICAgICAgYFByaW9yaXTDpHQ6ICR7b3Bwb3J0dW5pdHkucHJpb3JpdHl9YCwKICAgICAgYEltcGFjdDogJHtvcHBvcnR1bml0eS5pbXBhY3R9LzEwMGAsCiAgICAgIGBHZXNjaMOkdHp0ZXIgQXVmd2FuZDogJHtvcHBvcnR1bml0eS5lZmZvcnR9YCwKICAgICAgYFZvcmdlc2NobGFnZW5lIEFrdGlvbjogJHtvcHBvcnR1bml0eS5hY3Rpb259YCwKICAgICAgY2x1c3RlcgogICAgICAgID8gYENsdXN0ZXItU3RhbmQ6IFNjb3JlICR7Y2x1c3Rlci5zY29yZX0vMTAwLCBTdGF0dXMgJHtjbHVzdGVyLnN0YXR1c30sIExpbmthYmRlY2t1bmcgJHtjbHVzdGVyLmxpbmtDb3ZlcmFnZX0gJS5gCiAgICAgICAgOiAiQ2x1c3Rlci1EZXRhaWxkYXRlbiB2b3IgZGVyIEFyYmVpdCBhdXMgZGVtIFJlcG9zaXRvcnkgbmV1IGxhZGVuLiIsCiAgICAgIGNsdXN0ZXIKICAgICAgICA/IGBCZXN0YW5kOiAke2NsdXN0ZXIuY291bnRzLnBhZ2VzfSBSYXRnZWJlci9IdWJzLCAke2NsdXN0ZXIuY291bnRzLmNvbXBhcmlzb25zfSBWZXJnbGVpY2hlLCAke2NsdXN0ZXIuY291bnRzLnByb2R1Y3RzfSBQcm9kdWt0ZSwgJHtjbHVzdGVyLmNvdW50cy5tYW51ZmFjdHVyZXJzfSBIZXJzdGVsbGVyLmAKICAgICAgICA6ICIiLAogICAgICBgU3RyYXRlZ2lzY2hlIFJlZ2VsOiAke21vZGVSdWxlW3Byb2ZpbGUubW9kZV19YCwKICAgICAgLi4uZG9jdW1lbnRzLm1hcCgoZG9jdW1lbnQpID0+IGBWb3JoYW5kZW5lciBJbmhhbHQ6ICR7ZG9jdW1lbnR9YCksCiAgICBdLmZpbHRlcihCb29sZWFuKSwKICAgIG1pc3NpbmdEYXRhOiBbCiAgICAgICJBa3R1ZWxsZW4gUmVwb3NpdG9yeS1TdGFuZCB1bmQgZGllIHRhdHPDpGNobGljaGVuIEludGVudC1Pd25lciBkZXMgQ2x1c3RlcnMgcHLDvGZlbi4iLAogICAgICAiWndpc2NoZW4gVXBkYXRlLCBLb25zb2xpZGllcnVuZywgaW50ZXJuZXIgSm91cm5leSwgbmV1ZXIgU2VpdGUgdW5kIGJld3Vzc3RlbSBOaWNodHN0dW4gdW50ZXJzY2hlaWRlbi4iLAogICAgICAiQWJow6RuZ2lna2VpdGVuLCBSZWloZW5mb2xnZSwgWmllbHJvdXRlbiBvZGVyIFppZWxkYXRlaWVuIHVuZCBvYmpla3RpdmUgRmVydGlnLUtyaXRlcmllbiBmZXN0bGVnZW4uIiwKICAgICAgIk1heGltYWwgZHJlaSBlaW5mYWNoZSBuYWhlbGllZ2VuZGUgVmVyYmVzc2VydW5nZW4gaW0gc2VsYmVuIENsdXN0ZXIgbWl0bmVobWVuLCB3ZW5uIHNpZSBvaG5lIHp1c8OkdHpsaWNoZSBSZWNoZXJjaGUsIG5ldWUgQXJjaGl0ZWt0dXIgb2RlciBrw7xuc3RsaWNoZSBMaW5rcyBlaW5kZXV0aWcgc2lubnZvbGwgc2luZC4iLAogICAgICAiS2VpbmUgUm9hZG1hcC1QdW5rdGUgbnVyIGF1cyBTb2xsemFobGVuIG9kZXIgS2V5d29yZC1Ow6RoZSBhYmxlaXRlbi4iLAogICAgXSwKICAgIHZhbGlkYXRpb25Db21tYW5kczogWwogICAgICAibnBtIC0td29ya3NwYWNlIGFwcHMvcGZvdGVudGVjaG5payBydW4gYXVkaXQ6dG9waWNhbC1hdXRob3JpdHk6c3RyaWN0IiwKICAgICAgIm5wbSAtLXdvcmtzcGFjZSBhcHBzL3Bmb3RlbnRlY2huaWsgcnVuIGF1ZGl0OmRlY2lzaW9uLWpvdXJuZXlzOnN0cmljdCIsCiAgICAgICJucG0gLS13b3Jrc3BhY2UgYXBwcy9wZm90ZW50ZWNobmlrIHJ1biBhdWRpdDppbnRlcm5hbC1saW5rLWhlYWx0aDpzdHJpY3QiLAogICAgICAibnBtIC0td29ya3NwYWNlIGFwcHMvcGZvdGVudGVjaG5payBydW4gYXVkaXQ6Y29udGVudC1xdWFsaXR5OnN0cmljdCIsCiAgICAgICJucG0gLS13b3Jrc3BhY2UgYXBwcy9wZm90ZW50ZWNobmlrIHJ1biBidWlsZCIsCiAgICBdLAogICAgYWNjZXB0YW5jZUNyaXRlcmlhOiBbCiAgICAgIGBEaWUgUm9hZG1hcC1DaGFuY2Ug4oCeJHtvcHBvcnR1bml0eS50aXRsZX3igJwgaXN0IGFuaGFuZCBkZXMgYWt0dWVsbGVuIFJlcG9zaXRvcnktU3RhbmRzIGJlc3TDpHRpZ3QsIHByw6R6aXNpZXJ0IG9kZXIgYmVncsO8bmRldCB2ZXJ3b3JmZW4uYCwKICAgICAgIkplZGVyIFVtc2V0enVuZ3NzY2hyaXR0IG5lbm50IE51dHplcnByb2JsZW0sIFppZWxyb3V0ZSBvZGVyIERhdGVpLCBBYmjDpG5naWdrZWl0IHVuZCBwcsO8ZmJhcmVzIEVyZ2VibmlzLiIsCiAgICAgICJOZXVlIFNlaXRlbiB3ZXJkZW4gbnVyIGJlaSBlaWdlbnN0w6RuZGlnZXIgU3VjaGludGVudGlvbiB1bmQgZWNodGVtIEluZm9ybWF0aW9uIEdhaW4gdm9yZ2VzZWhlbi4iLAogICAgICAiTmFoZWxpZWdlbmRlIFp1c2F0enZlcmJlc3NlcnVuZ2VuIGJsZWliZW4gYXVmIG1heGltYWwgZHJlaSBrbGVpbmUgTWHDn25haG1lbiBpbSBzZWxiZW4gQ2x1c3RlciBiZWdyZW56dC4iLAogICAgICAiVG9waWNhbC1BdXRob3JpdHktLCBKb3VybmV5LSwgSW50ZXJuYWwtTGluay0gdW5kIENvbnRlbnQtUXVhbGl0eS1QcsO8ZnVuZ2VuIHNpbmQgbmFjaCBkZXIgVW1zZXR6dW5nIGRva3VtZW50aWVydC4iLAogICAgXSwKICB9Owp9OwoKY29uc3QgYXBwZW5kQ2hhdEdwdFJvYWRtYXBJbnN0cnVjdGlvbnMgPSAoCiAgcHJvbXB0OiBzdHJpbmcsCiAgb3Bwb3J0dW5pdHk6IE9wcG9ydHVuaXR5LAogIGNsdXN0ZXJMYWJlbDogc3RyaW5nLAopOiBzdHJpbmcgPT4KICBbCiAgICBwcm9tcHQsCiAgICAiIiwKICAgICJUT1BJQ0FMLUFVVEhPUklUWS1ST0FETUFQIiwKICAgIGBSb2FkbWFwLUNoYW5jZTogJHtvcHBvcnR1bml0eS50aXRsZX1gLAogICAgYFRoZW1lbmNsdXN0ZXI6ICR7Y2x1c3RlckxhYmVsfWAsCiAgICAiIiwKICAgICJMaWVmZXJlIGVpbmUgZW50c2NoZWlkdW5nc3JlaWZlIFJvYWRtYXAgbWl0OiIsCiAgICAiMS4gQmVzdMOkdGlndGVyIE51dHplci0gdW5kIFN1Y2hpbnRlbnRpb24uIiwKICAgICIyLiBBa3R1ZWxsZW0gSW50ZW50LU93bmVyIHVuZCBtw7ZnbGljaGVyIEthbm5pYmFsaXNpZXJ1bmcuIiwKICAgICIzLiBFbnRzY2hlaWR1bmc6IGFrdHVhbGlzaWVyZW4sIGtvbnNvbGlkaWVyZW4sIEpvdXJuZXkgc2NobGllw59lbiwgbmV1IGFubGVnZW4gb2RlciB2ZXJ3ZXJmZW4uIiwKICAgICI0LiBQcmlvcmlzaWVydGVyIFJlaWhlbmZvbGdlIG1pdCBBYmjDpG5naWdrZWl0ZW4uIiwKICAgICI1LiBLb25rcmV0ZW4gWmllbHJvdXRlbiBvZGVyIFJlcG9zaXRvcnktRGF0ZWllbiwgc293ZWl0IGF1cyBkZW0gQmVzdGFuZCBiZWxlZ2Jhci4iLAogICAgIjYuIEluZm9ybWF0aW9uIEdhaW4gdW5kIE51dHplbiBmw7xyIGRlbiBMZXNlci4iLAogICAgIjcuIE9iamVrdGl2ZW4gQWt6ZXB0YW56a3JpdGVyaWVuIHVuZCBwYXNzZW5kZW4gQXVkaXRzLiIsCiAgICAiOC4gTWF4aW1hbCBkcmVpIGtsZWluZW4gbmFoZWxpZWdlbmRlbiBWZXJiZXNzZXJ1bmdlbiBpbSBzZWxiZW4gQ2x1c3Rlci4iLAogICAgIiIsCiAgICAiS2VpbmUgRGF0ZWllbiDDpG5kZXJuLiBLZWluZSBTZWl0ZW4gb2RlciBQcm9kdWt0ZGF0ZW4gZXJmaW5kZW4uIFVuc2ljaGVyZSBQdW5rdGUgYWxzIG9mZmVuZSBSZWNoZXJjaGVmcmFnZSBtYXJraWVyZW4uIiwKICBdLmpvaW4oIlxuIik7Cgpjb25zdCBhcHBlbmRDb2RleFJvYWRtYXBJbnN0cnVjdGlvbnMgPSAoCiAgcHJvbXB0OiBzdHJpbmcsCiAgb3Bwb3J0dW5pdHk6IE9wcG9ydHVuaXR5LAogIGNsdXN0ZXJMYWJlbDogc3RyaW5nLAopOiBzdHJpbmcgPT4KICBbCiAgICBwcm9tcHQsCiAgICAiIiwKICAgICJUT1BJQ0FMLUFVVEhPUklUWS1ST0FETUFQIFVNU0VUWkVOIiwKICAgIGBSb2FkbWFwLUNoYW5jZTogJHtvcHBvcnR1bml0eS50aXRsZX1gLAogICAgYFRoZW1lbmNsdXN0ZXI6ICR7Y2x1c3RlckxhYmVsfWAsCiAgICAiIiwKICAgICJBcmJlaXRlIGRpZSBiZXN0w6R0aWd0ZSBSb2FkbWFwIHZvbGxzdMOkbmRpZyBpbSBSZXBvc2l0b3J5IGFiLiIsCiAgICAiRXJzdGVsbGUgZWluZW4ga29uZmxpa3Rhcm1lbiwgd2llZGVyaG9sYmFyZW4gSW5zdGFsbGVyLVBhdGNoIGltIE9yZG5lciAzLiIsCiAgICAiQmVoZWJlIFVyc2FjaGVuIHplbnRyYWwgdW5kIGVyd2VpdGVyZSB2b3JoYW5kZW5lIEtvbXBvbmVudGVuLCBEYXRlbm1vZGVsbGUgdW5kIEpvdXJuZXktTG9naWsgc3RhdHQgU29uZGVycmVnZWxuIGF1Znp1YmF1ZW4uIiwKICAgICJEYXMga29ua3JldGUgUm9hZG1hcC1aaWVsIGlzdCBQZmxpY2h0LiBOaW1tIG1heGltYWwgZHJlaSBlaW5mYWNoZSBuYWhlbGllZ2VuZGUgVmVyYmVzc2VydW5nZW4gaW0gc2VsYmVuIENsdXN0ZXIgbWl0LCB3ZW5uIHNpZSBvaG5lIG5ldWUgUmVjaGVyY2hlLCBDU1Mtw4RuZGVydW5nLCBBcmNoaXRla3R1cnVtYmF1IG9kZXIga8O8bnN0bGljaGUgTGlua3MgZWluZGV1dGlnIHNpbm52b2xsIHNpbmQuIiwKICAgICJMZWdlIGtlaW5lIG5ldWUgU2VpdGUgYWxsZWluIHdlZ2VuIFNvbGx6YWhsZW4gb2RlciBLZXl3b3JkLU7DpGhlIGFuLiIsCiAgICAiRsO8aHJlIGRpZSBhbmdlZ2ViZW5lbiBBdWRpdHMgdW5kIGRlbiBCdWlsZCBhdXMuIERva3VtZW50aWVyZSBnZcOkbmRlcnRlIERhdGVpZW4sIEVudHNjaGVpZHVuZ2VuLCBiZXd1c3N0IG5pY2h0IHVtZ2VzZXR6dGUgUHVua3RlIHVuZCB2ZXJibGVpYmVuZGUgR3Jlbnplbi4iLAogIF0uam9pbigiXG4iKTsKCmV4cG9ydCBjb25zdCBidWlsZFRvcGljYWxBdXRob3JpdHlSb2FkbWFwUHJvbXB0cyA9ICgKICBvcHBvcnR1bml0eTogT3Bwb3J0dW5pdHksCiAgY2x1c3Rlcj86IENsdXN0ZXIsCik6IFRvcGljYWxBdXRob3JpdHlSb2FkbWFwUHJvbXB0UGFpciA9PiB7CiAgY29uc3QgY29udGV4dCA9IHJvYWRtYXBTcGVjaWZpY0NvbnRleHQob3Bwb3J0dW5pdHksIGNsdXN0ZXIpOwogIGNvbnN0IGd1aWRlcyA9IGxpc3REb2N1bWVudHMoY2x1c3RlciwgInBhZ2UiKTsKICBjb25zdCBjb21wYXJpc29ucyA9IGxpc3REb2N1bWVudHMoY2x1c3RlciwgImNvbXBhcmlzb24iKTsKCiAgY29uc3QgaW5wdXQgPSB7CiAgICBraW5kOiBjb250ZXh0LnByb2ZpbGUua2luZCwKICAgIHRpdGxlOiBgVG9waWNhbC1BdXRob3JpdHktUm9hZG1hcDogJHtvcHBvcnR1bml0eS50aXRsZX1gLAogICAgY2F0ZWdvcnk6IGNvbnRleHQuY2x1c3RlckxhYmVsLAogICAgcHJvYmxlbXM6IGNvbnRleHQucHJvYmxlbXMsCiAgICBleGlzdGluZ0RhdGE6IGNvbnRleHQuZXhpc3RpbmdEYXRhLAogICAgbWlzc2luZ0RhdGE6IGNvbnRleHQubWlzc2luZ0RhdGEsCiAgICBndWlkZXMsCiAgICBjb21wYXJpc29ucywKICAgIGltYWdlUmVxdWlyZW1lbnRzOiBbXSwKICAgIHZhbGlkYXRpb25Db21tYW5kczogY29udGV4dC52YWxpZGF0aW9uQ29tbWFuZHMsCiAgICBhY2NlcHRhbmNlQ3JpdGVyaWE6IGNvbnRleHQuYWNjZXB0YW5jZUNyaXRlcmlhLAogIH07CgogIGNvbnN0IGNoYXRncHQgPSBidWlsZENoYXRHcHRQcm9tcHQoaW5wdXQsIHsKICAgIHRlbXBsYXRlSWQ6IGNvbnRleHQucHJvZmlsZS50ZW1wbGF0ZUlkLAogIH0pOwogIGNvbnN0IGNvZGV4ID0gYnVpbGRDb2RleFByb21wdChpbnB1dCwgewogICAgdGVtcGxhdGVJZDogY29udGV4dC5wcm9maWxlLnRlbXBsYXRlSWQsCiAgfSk7CgogIHJldHVybiB7CiAgICBjaGF0Z3B0OiBhcHBlbmRDaGF0R3B0Um9hZG1hcEluc3RydWN0aW9ucygKICAgICAgY2hhdGdwdC5wcm9tcHQsCiAgICAgIG9wcG9ydHVuaXR5LAogICAgICBjb250ZXh0LmNsdXN0ZXJMYWJlbCwKICAgICksCiAgICBjb2RleDogYXBwZW5kQ29kZXhSb2FkbWFwSW5zdHJ1Y3Rpb25zKAogICAgICBjb2RleC5wcm9tcHQsCiAgICAgIG9wcG9ydHVuaXR5LAogICAgICBjb250ZXh0LmNsdXN0ZXJMYWJlbCwKICAgICksCiAgfTsKfTsK", "base64").toString("utf8");
const testContent = Buffer.from("aW1wb3J0IGZzIGZyb20gIm5vZGU6ZnMiOwppbXBvcnQgcGF0aCBmcm9tICJub2RlOnBhdGgiOwppbXBvcnQgdGVzdCBmcm9tICJub2RlOnRlc3QiOwppbXBvcnQgYXNzZXJ0IGZyb20gIm5vZGU6YXNzZXJ0L3N0cmljdCI7CmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICJub2RlOnVybCI7Cgpjb25zdCBhcHBSb290ID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpLCAiLi4iKTsKY29uc3QgcmVhZCA9IChyZWxhdGl2ZSkgPT4gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihhcHBSb290LCByZWxhdGl2ZSksICJ1dGY4Iik7Cgp0ZXN0KCJUb3BpY2FsLUF1dGhvcml0eS1Sb2FkbWFwcyBiZXNpdHplbiB6ZW50cmFsZSBQcm9tcHQtRXJ6ZXVndW5nIiwgKCkgPT4gewogIGNvbnN0IHNvdXJjZSA9IHJlYWQoInNyYy9saWIvc2VvL3RvcGljYWwtYXV0aG9yaXR5L3JvYWRtYXAtcHJvbXB0cy50cyIpOwoKICBhc3NlcnQubWF0Y2goc291cmNlLCAvYnVpbGRUb3BpY2FsQXV0aG9yaXR5Um9hZG1hcFByb21wdHMvKTsKICBhc3NlcnQubWF0Y2goc291cmNlLCAvYnVpbGRDaGF0R3B0UHJvbXB0Lyk7CiAgYXNzZXJ0Lm1hdGNoKHNvdXJjZSwgL2J1aWxkQ29kZXhQcm9tcHQvKTsKICBhc3NlcnQubWF0Y2goc291cmNlLCAvVE9QSUNBTC1BVVRIT1JJVFktUk9BRE1BUC8pOwogIGFzc2VydC5tYXRjaChzb3VyY2UsIC9JbnN0YWxsZXItUGF0Y2ggaW0gT3JkbmVyIDMvKTsKICBhc3NlcnQubWF0Y2goc291cmNlLCAvTWF4aW1hbCBkcmVpIGVpbmZhY2hlIG5haGVsaWVnZW5kZSBWZXJiZXNzZXJ1bmdlbi8pOwp9KTsKCnRlc3QoIlJvYWRtYXAtUHJvbXB0cyB1bnRlcnNjaGVpZGVuIEtvbnNvbGlkaWVydW5nLCBKb3VybmV5LCBFeHBhbnNpb24gdW5kIFZhbGlkaWVydW5nIiwgKCkgPT4gewogIGNvbnN0IHNvdXJjZSA9IHJlYWQoInNyYy9saWIvc2VvL3RvcGljYWwtYXV0aG9yaXR5L3JvYWRtYXAtcHJvbXB0cy50cyIpOwoKICBhc3NlcnQubWF0Y2goc291cmNlLCAvbW9kZTogImNvbnNvbGlkYXRlIi8pOwogIGFzc2VydC5tYXRjaChzb3VyY2UsIC9tb2RlOiAiam91cm5leSIvKTsKICBhc3NlcnQubWF0Y2goc291cmNlLCAvbW9kZTogImV4cGFuZCIvKTsKICBhc3NlcnQubWF0Y2goc291cmNlLCAvbW9kZTogInZhbGlkYXRlIi8pOwogIGFzc2VydC5tYXRjaChzb3VyY2UsIC9Lb25zb2xpZGllcmVuIHVuZCBzY2jDpHJmZW4gaGF0IFZvcnJhbmcgdm9yIG5ldWVuIFNlaXRlbi8pOwogIGFzc2VydC5tYXRjaChzb3VyY2UsIC9Hb1wvTm8tR28vKTsKfSk7Cgp0ZXN0KCJUb3BpY2FsLUF1dGhvcml0eS1TZWl0ZSB6ZWlndCBiZWlkZSBSb2FkbWFwLVByb21wdC1Ba3Rpb25lbiIsICgpID0+IHsKICBjb25zdCBwYWdlID0gcmVhZCgic3JjL3BhZ2VzL2FkbWluL3Nlby90b3BpY2FsLWF1dGhvcml0eS5hc3RybyIpOwoKICBhc3NlcnQubWF0Y2gocGFnZSwgL2J1aWxkVG9waWNhbEF1dGhvcml0eVJvYWRtYXBQcm9tcHRzLyk7CiAgYXNzZXJ0Lm1hdGNoKHBhZ2UsIC9yb2FkbWFwT3Bwb3J0dW5pdGllcy8pOwogIGFzc2VydC5tYXRjaChwYWdlLCAvQ2hhdEdQVC1Sb2FkbWFwIGtvcGllcmVuLyk7CiAgYXNzZXJ0Lm1hdGNoKHBhZ2UsIC9Db2RleC1VbXNldHp1bmcga29waWVyZW4vKTsKICBhc3NlcnQubWF0Y2gocGFnZSwgL2RhdGEtY29weS1raW5kPSJDaGF0R1BULVJvYWRtYXAiLyk7CiAgYXNzZXJ0Lm1hdGNoKHBhZ2UsIC9kYXRhLWNvcHkta2luZD0iQ29kZXgtVW1zZXR6dW5nIi8pOwp9KTsK", "base64").toString("utf8");

if (!fs.existsSync(PAGE)) throw new Error("Topical-Authority-Seite nicht gefunden.");

const originalPage = fs.readFileSync(PAGE, "utf8");
for (const marker of ["data.opportunities", "priorityLabels", "data-copy-prompt", "Strategische Chancen"]) {
  if (!originalPage.includes(marker)) throw new Error(`Erwartete Roadmap-Struktur fehlt: ${marker}`);
}

let page = originalPage;

if (!page.includes('from "../../../lib/seo/topical-authority/roadmap-prompts"')) {
  const anchor = 'import { loadTopicalAuthority } from "../../../lib/seo/topical-authority/loadTopicalAuthority";';
  if (!page.includes(anchor)) throw new Error("Import-Anker für loadTopicalAuthority fehlt.");
  page = page.replace(
    anchor,
    `${anchor}\nimport { buildTopicalAuthorityRoadmapPrompts } from "../../../lib/seo/topical-authority/roadmap-prompts";`,
  );
}

if (!page.includes("const roadmapOpportunities =")) {
  const priorityStart = page.indexOf("const priorityLabels =");
  const frontmatterEnd = page.indexOf("\n---", priorityStart);
  if (priorityStart < 0 || frontmatterEnd < 0) throw new Error("Frontmatter-Einfügeposition für Roadmap-Prompts fehlt.");

  const block = `\n\nconst clusterByLabel = new Map(\n  data.clusters.map((cluster) => [cluster.label, cluster]),\n);\nconst roadmapOpportunities = data.opportunities.map((opportunity) => ({\n  ...opportunity,\n  prompts: buildTopicalAuthorityRoadmapPrompts(\n    opportunity,\n    clusterByLabel.get(opportunity.cluster),\n  ),\n}));\n`;
  page = page.slice(0, frontmatterEnd) + block + page.slice(frontmatterEnd);
}

page = page
  .replace("data.opportunities.length === 0", "roadmapOpportunities.length === 0")
  .replace("data.opportunities.map((opportunity) => (", "roadmapOpportunities.map((opportunity) => (");

if (!page.includes("ChatGPT-Roadmap kopieren")) {
  const actionAnchor = '            <strong>{opportunity?.action ?? ""}</strong>';
  if (!page.includes(actionAnchor)) throw new Error("Roadmap-Aktionsanker fehlt.");

  page = page.replace(
    actionAnchor,
    `${actionAnchor}\n            <div class="ta-roadmap-actions">\n              <button\n                type="button"\n                class="ta-copy-prompt"\n                data-copy-prompt={opportunity.prompts.chatgpt}\n                data-copy-kind="ChatGPT-Roadmap"\n              >\n                ChatGPT-Roadmap kopieren\n              </button>\n              <button\n                type="button"\n                class="ta-copy-prompt"\n                data-copy-prompt={opportunity.prompts.codex}\n                data-copy-kind="Codex-Umsetzung"\n              >\n                Codex-Umsetzung kopieren\n              </button>\n            </div>`,
  );
}

if (!page.includes('button.dataset.copyKind || "Prompt"')) {
  page = page.replace(
    '    const prompt = button.dataset.copyPrompt || "";\n    if (!prompt) return;',
    '    const prompt = button.dataset.copyPrompt || "";\n    const promptKind = button.dataset.copyKind || "Prompt";\n    if (!prompt) return;',
  );
  page = page.replace(
    '      window.prompt("Codex-Prompt kopieren:", prompt);',
    '      window.prompt(`${promptKind} kopieren:`, prompt);',
  );
}

if (!page.includes(".ta-roadmap-actions{")) {
  const styleAnchor = "  @media(max-width: 900px)";
  if (!page.includes(styleAnchor)) throw new Error("CSS-Anker für Roadmap-Aktionen fehlt.");
  page = page.replace(
    styleAnchor,
    '  .ta-roadmap-actions{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:.9rem}\n  .ta-roadmap-actions .ta-copy-prompt{flex:0 1 auto}\n' + styleAnchor,
  );
}

for (const marker of [
  "buildTopicalAuthorityRoadmapPrompts",
  "const roadmapOpportunities =",
  "ChatGPT-Roadmap kopieren",
  "Codex-Umsetzung kopieren",
  'data-copy-kind="ChatGPT-Roadmap"',
  'data-copy-kind="Codex-Umsetzung"',
  ".ta-roadmap-actions{",
]) {
  if (!page.includes(marker)) throw new Error(`Roadmap-Prompt-Integration unvollständig: ${marker}`);
}

const changes = [];
if (!fs.existsSync(MODULE) || fs.readFileSync(MODULE, "utf8") !== moduleContent) {
  if (fs.existsSync(MODULE)) {
    const current = fs.readFileSync(MODULE, "utf8");
    if (!current.includes("TOPICAL_AUTHORITY_ROADMAP_PROMPTS_VERSION")) {
      throw new Error("roadmap-prompts.ts existiert bereits mit unbekanntem Inhalt. Abbruch ohne Überschreiben.");
    }
  }
  changes.push([MODULE, moduleContent]);
}
if (page !== originalPage) changes.push([PAGE, page]);
if (!fs.existsSync(TEST) || fs.readFileSync(TEST, "utf8") !== testContent) changes.push([TEST, testContent]);

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(`[${NAME}] Zu ändernde Dateien: ${changes.length}`);
  for (const [file] of changes) console.log(`- ${path.relative(ROOT, file)}`);
  process.exit(0);
}

if (changes.length) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);

  for (const [file, content] of changes) {
    if (fs.existsSync(file)) {
      const backup = path.join(backupRoot, path.relative(ROOT, file));
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.copyFileSync(file, backup);
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, "utf8");
    console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, file)}`);
  }
  console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);
} else {
  console.log(`[${NAME}] Bereits aktuell.`);
}

if (runTests) {
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--test",
      "apps/pfotentechnik/test/topical-authority-roadmap-prompts-1.0.1.test.mjs",
      "apps/pfotentechnik/test/topical-authority-center.test.mjs",
    ],
    { cwd: ROOT, stdio: "inherit" },
  );

  if (process.platform === "win32") {
    execFileSync(
      "cmd.exe",
      ["/d", "/s", "/c", "npm --workspace apps/pfotentechnik run audit:topical-authority:strict"],
      { cwd: ROOT, stdio: "inherit" },
    );
  } else {
    execFileSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", "audit:topical-authority:strict"],
      { cwd: ROOT, stdio: "inherit" },
    );
  }
}

if (runBuild) {
  if (process.platform === "win32") {
    execFileSync(
      "cmd.exe",
      ["/d", "/s", "/c", "npm --workspace apps/pfotentechnik run build"],
      { cwd: ROOT, stdio: "inherit" },
    );
  } else {
    execFileSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", "build"],
      { cwd: ROOT, stdio: "inherit" },
    );
  }
}

console.log(`[${NAME}] Fertig.`);
console.log(`[${NAME}] Jede strategische Roadmap-Chance besitzt jetzt einen ChatGPT- und einen Codex-Prompt.`);
