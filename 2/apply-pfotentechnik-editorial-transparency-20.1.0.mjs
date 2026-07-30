#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const PATCH_NAME = "pfotentechnik-editorial-transparency-20.1.0";
const args = process.argv.slice(2);
const force = args.includes("--force");
const skipAudit = args.includes("--skip-audit");
const rootIndex = args.indexOf("--root");
const explicitRoot = rootIndex >= 0 ? args[rootIndex + 1] : null;

const findRepoRoot = (start) => {
  if (!start) return null;
  let current = path.resolve(start);

  while (true) {
    if (
      fs.existsSync(path.join(current, "apps/pfotentechnik/package.json")) &&
      fs.existsSync(path.join(current, "packages"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
};

const repoRoot =
  findRepoRoot(explicitRoot) ??
  findRepoRoot(process.cwd()) ??
  findRepoRoot(path.resolve(import.meta.dirname, ".."));

if (!repoRoot) {
  console.error(`[${PATCH_NAME}] Repository-Wurzel nicht gefunden.`);
  console.error("Starte den Installer im Root von Yushamon/affiliate-template oder nutze --root <pfad>.");
  process.exit(1);
}

const appRoot = path.join(repoRoot, "apps/pfotentechnik");
const files = {
  page: path.join(appRoot, "src/pages/[slug].astro"),
  component: path.join(appRoot, "src/components/EditorialTransparency.astro"),
  audit: path.join(appRoot, "scripts/audit-editorial-transparency.mjs")
};

for (const [label, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    console.error(`[${PATCH_NAME}] Pflichtdatei fehlt (${label}): ${path.relative(repoRoot, file)}`);
    process.exit(1);
  }
}

const read = (file) => fs.readFileSync(file, "utf8");
const original = {
  page: read(files.page),
  component: read(files.component),
  audit: read(files.audit)
};

const componentTarget = Buffer.from("LS0tCnR5cGUgQ29udGVudEtpbmQgPSAicmF0Z2ViZXIiIHwgInByb2R1a3QiIHwgInZlcmdsZWljaCI7CnR5cGUgVGVzdFN0YXR1cyA9CiAgfCAiaGFuZHMtb24iCiAgfCAiZWRpdG9yaWFsLXJldmlldyIKICB8ICJtYW51ZmFjdHVyZXItZGF0YSIKICB8ICJsb25nLXRlcm0tdGVzdCIKICB8ICJub3QtdGVzdGVkIjsKCmludGVyZmFjZSBQcm9wcyB7CiAga2luZDogQ29udGVudEtpbmQ7CiAgYXV0aG9yPzogeyBuYW1lOiBzdHJpbmc7IHJvbGU/OiBzdHJpbmc7IHVybD86IHN0cmluZyB9OwogIHB1Ymxpc2hlZEF0Pzogc3RyaW5nOwogIHVwZGF0ZWRBdD86IHN0cmluZzsKICB0ZXN0U3RhdHVzPzogVGVzdFN0YXR1czsKICBldmlkZW5jZT86IHN0cmluZ1tdOwogIHJlY29tbWVuZGF0aW9uUmVhc29uPzogc3RyaW5nOwp9Cgpjb25zdCB7CiAga2luZCwKICBhdXRob3IgPSB7CiAgICBuYW1lOiAiUGZvdGVuVGVjaG5payBSZWRha3Rpb24iLAogICAgcm9sZTogIlJlZGFrdGlvbiIsCiAgICB1cmw6ICIvcmVkYWt0aW9uLyIKICB9LAogIHB1Ymxpc2hlZEF0LAogIHVwZGF0ZWRBdCwKICB0ZXN0U3RhdHVzLAogIGV2aWRlbmNlID0gW10sCiAgcmVjb21tZW5kYXRpb25SZWFzb24KfSA9IEFzdHJvLnByb3BzIGFzIFByb3BzOwoKY29uc3Qgc3RhdHVzQ29weTogUmVjb3JkPFRlc3RTdGF0dXMsIHsgbGFiZWw6IHN0cmluZzsgdGV4dDogc3RyaW5nIH0+ID0gewogICJoYW5kcy1vbiI6IHsKICAgIGxhYmVsOiAiUHJha3Rpc2NoIGdlcHLDvGZ0IiwKICAgIHRleHQ6ICJGw7xyIGRpZXNlIEVpbm9yZG51bmcgbGFnZW4gZWlnZW5lIHByYWt0aXNjaGUgQmVvYmFjaHR1bmdlbiBhbSBQcm9kdWt0IHZvci4iCiAgfSwKICAibG9uZy10ZXJtLXRlc3QiOiB7CiAgICBsYWJlbDogIkltIExhbmd6ZWl0dGVzdCIsCiAgICB0ZXh0OiAiRGFzIFByb2R1a3Qgd3VyZGUgw7xiZXIgZWluZW4gbMOkbmdlcmVuIFplaXRyYXVtIGltIEFsbHRhZyBiZW9iYWNodGV0LiIKICB9LAogICJlZGl0b3JpYWwtcmV2aWV3IjogewogICAgbGFiZWw6ICJSZWRha3Rpb25lbGwgZ2VwcsO8ZnQiLAogICAgdGV4dDogIkRpZSBFaW5vcmRudW5nIGJlcnVodCBhdWYgZG9rdW1lbnRpZXJ0ZW4gUHJvZHVrdGRhdGVuLCBRdWVsbGVuYWJnbGVpY2ggdW5kIFZlcmdsZWljaCBtaXQgcmVsZXZhbnRlbiBBbHRlcm5hdGl2ZW4uIgogIH0sCiAgIm1hbnVmYWN0dXJlci1kYXRhIjogewogICAgbGFiZWw6ICJEYXRlbmNoZWNrIiwKICAgIHRleHQ6ICJEaWUgRWlub3JkbnVuZyBzdMO8dHp0IHNpY2ggYXVmIEhlcnN0ZWxsZXJ1bnRlcmxhZ2VuIHVuZCB0ZWNobmlzY2hlIERhdGVuLiBFaW4gZWlnZW5lciBQcmF4aXN0ZXN0IGxpZWd0IG5pY2h0IHZvci4iCiAgfSwKICAibm90LXRlc3RlZCI6IHsKICAgIGxhYmVsOiAiTmljaHQgcHJha3Rpc2NoIGdldGVzdGV0IiwKICAgIHRleHQ6ICJFcyBsaWVndCBrZWluIGVpZ2VuZXIgUHJvZHVrdHRlc3Qgdm9yLiBBdXNzYWdlbiBiZXNjaHLDpG5rZW4gc2ljaCBhdWYgYmVsZWdiYXJlIERhdGVuIHVuZCBrbGFyIGdla2VubnplaWNobmV0ZSBFaW5vcmRudW5nLiIKICB9Cn07Cgpjb25zdCBldmlkZW5jZUxhYmVsczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHsKICAibWFudWZhY3R1cmVyLWRvY3VtZW50YXRpb24iOiAiSGVyc3RlbGxlcnVudGVybGFnZW4iLAogICJ0ZWNobmljYWwtc3BlY2lmaWNhdGlvbnMiOiAidGVjaG5pc2NoZSBEYXRlbiIsCiAgImNvbXBhcmF0aXZlLWFuYWx5c2lzIjogInZlcmdsZWljaGVuZGUgQW5hbHlzZSIsCiAgInVzZXItZXhwZXJpZW5jZSI6ICJkb2t1bWVudGllcnRlIE51dHplcmVyZmFocnVuZ2VuIiwKICAiaGFuZHMtb24tdGVzdGluZyI6ICJlaWdlbmUgcHJha3Rpc2NoZSBQcsO8ZnVuZyIsCiAgImxvbmctdGVybS10ZXN0aW5nIjogImVpZ2VuZXIgTGFuZ3plaXR0ZXN0IiwKICAiZXhwZXJ0LWd1aWRhbmNlIjogIkZhY2hxdWVsbGVuIHVuZCBMZWl0bGluaWVuIgp9OwoKY29uc3QgZm9ybWF0RGF0ZSA9ICh2YWx1ZT86IHN0cmluZykgPT4gdmFsdWUKICA/IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCJkZS1ERSIsIHsKICAgICAgZGF5OiAiMi1kaWdpdCIsCiAgICAgIG1vbnRoOiAibG9uZyIsCiAgICAgIHllYXI6ICJudW1lcmljIgogICAgfSkuZm9ybWF0KG5ldyBEYXRlKHZhbHVlKSkKICA6IG51bGw7Cgpjb25zdCBjdXJyZW50U3RhdHVzID0gdGVzdFN0YXR1cyA/IHN0YXR1c0NvcHlbdGVzdFN0YXR1c10gOiBudWxsOwpjb25zdCBldmlkZW5jZVRleHQgPSBldmlkZW5jZQogIC5tYXAoKGl0ZW0pID0+IGV2aWRlbmNlTGFiZWxzW2l0ZW1dID8/IGl0ZW0pCiAgLmZpbHRlcihCb29sZWFuKQogIC5qb2luKCIsICIpOwpjb25zdCBhdXRob3JIcmVmID0gYXV0aG9yLnVybCB8fCAiL3JlZGFrdGlvbi8iOwpjb25zdCBjb250ZW50TGFiZWwgPSBraW5kID09PSAicHJvZHVrdCIKICA/ICJQcm9kdWt0YmV3ZXJ0dW5nIgogIDoga2luZCA9PT0gInZlcmdsZWljaCIKICAgID8gIlZlcmdsZWljaCIKICAgIDogIlJhdGdlYmVyIjsKY29uc3QgaXNDb21wYWN0R3VpZGUgPSBraW5kID09PSAicmF0Z2ViZXIiOwpjb25zdCBjb250YWluZXJDbGFzcyA9IGlzQ29tcGFjdEd1aWRlCiAgPyAiZWRpdG9yaWFsLXRyYW5zcGFyZW5jeSBlZGl0b3JpYWwtdHJhbnNwYXJlbmN5LS1jb21wYWN0IgogIDogImVkaXRvcmlhbC10cmFuc3BhcmVuY3kiOwotLS0KCjxhc2lkZSBjbGFzcz17Y29udGFpbmVyQ2xhc3N9IGFyaWEtbGFiZWxsZWRieT0iZWRpdG9yaWFsLXRyYW5zcGFyZW5jeS10aXRsZSI+CiAge2lzQ29tcGFjdEd1aWRlID8gKAogICAgPGRldGFpbHMgY2xhc3M9ImVkaXRvcmlhbC10cmFuc3BhcmVuY3lfX2NvbXBhY3QtZGV0YWlscyI+CiAgICAgIDxzdW1tYXJ5PgogICAgICAgIDxzcGFuIGNsYXNzPSJlZGl0b3JpYWwtdHJhbnNwYXJlbmN5X19jb21wYWN0LWtpY2tlciI+UmVkYWt0aW9uZWxsZSBUcmFuc3BhcmVuejwvc3Bhbj4KICAgICAgICA8c3Ryb25nIGlkPSJlZGl0b3JpYWwtdHJhbnNwYXJlbmN5LXRpdGxlIj5RdWVsbGVuYmFzaWVydCBlaW5nZW9yZG5ldDwvc3Ryb25nPgogICAgICAgIDxzbWFsbD5NZXRob2RpayB1bmQgRmluYW56aWVydW5nPC9zbWFsbD4KICAgICAgPC9zdW1tYXJ5PgoKICAgICAgPGRpdiBjbGFzcz0iZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fY29tcGFjdC1ib2R5Ij4KICAgICAgICA8cD4KICAgICAgICAgIDxzdHJvbmc+UHLDvGZhcnQ6PC9zdHJvbmc+IERpZXNlciBSYXRnZWJlciBiYXNpZXJ0IGF1ZiBkZW4gaW0gQmVpdHJhZyBnZW5hbm50ZW4gRGF0ZW4gdW5kIFF1ZWxsZW4uCiAgICAgICAgPC9wPgogICAgICAgIDxwPgogICAgICAgICAgPHN0cm9uZz5GaW5hbnppZXJ1bmc6PC9zdHJvbmc+IEFmZmlsaWF0ZS1maW5hbnppZXJ0LCByZWRha3Rpb25lbGwgZ2V0cmVubnQuIFByb3Zpc2lvbmVuIHZlcsOkbmRlcm4gd2VkZXIgQXVzc2FnZW4gbm9jaCBFbXBmZWhsdW5nZW47IGRlciBLYXVmcHJlaXMgYmxlaWJ0IGdsZWljaC4KICAgICAgICA8L3A+CiAgICAgICAgPG5hdiBhcmlhLWxhYmVsPSJSZWRha3Rpb25lbGxlIEluZm9ybWF0aW9uZW4iPgogICAgICAgICAgPGEgaHJlZj0iL3NvLWJld2VydGVuLXdpci8iPk1ldGhvZGlrIHVuZCBCZXdlcnR1bmdzc3lzdGVtPC9hPgogICAgICAgICAgPGEgaHJlZj0iL3JlZGFrdGlvbi8iPlJlZGFrdGlvbiB1bmQgVW5hYmjDpG5naWdrZWl0PC9hPgogICAgICAgICAgPGEgaHJlZj0iL2FmZmlsaWF0ZS1oaW53ZWlzLyI+QWZmaWxpYXRlLU9mZmVubGVndW5nPC9hPgogICAgICAgICAgPGEgaHJlZj0iL2tvbnRha3QvIj5GZWhsZXIgbWVsZGVuPC9hPgogICAgICAgIDwvbmF2PgogICAgICA8L2Rpdj4KICAgIDwvZGV0YWlscz4KICApIDogKAogICAgPD4KICAgICAgPGRpdiBjbGFzcz0iZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9faGVhZGluZyI+CiAgICAgICAgPHNwYW4+UmVkYWt0aW9uZWxsZSBUcmFuc3BhcmVuejwvc3Bhbj4KICAgICAgICA8aDIgaWQ9ImVkaXRvcmlhbC10cmFuc3BhcmVuY3ktdGl0bGUiPlNvIGlzdCBkaWVzZSBTZWl0ZSBlaW56dW9yZG5lbjwvaDI+CiAgICAgIDwvZGl2PgoKICAgICAgPGRsIGNsYXNzPSJlZGl0b3JpYWwtdHJhbnNwYXJlbmN5X19mYWN0cyI+CiAgICAgICAgPGRpdj4KICAgICAgICAgIDxkdD5WZXJhbnR3b3J0bGljaDwvZHQ+CiAgICAgICAgICA8ZGQ+CiAgICAgICAgICAgIDxhIGhyZWY9e2F1dGhvckhyZWZ9PnthdXRob3IubmFtZX08L2E+CiAgICAgICAgICAgIHthdXRob3Iucm9sZSAmJiA8c21hbGw+e2F1dGhvci5yb2xlfTwvc21hbGw+fQogICAgICAgICAgPC9kZD4KICAgICAgICA8L2Rpdj4KICAgICAgICA8ZGl2PgogICAgICAgICAgPGR0PlN0YW5kPC9kdD4KICAgICAgICAgIDxkZD4KICAgICAgICAgICAge2Zvcm1hdERhdGUodXBkYXRlZEF0KSA/PyBmb3JtYXREYXRlKHB1Ymxpc2hlZEF0KSA/PyAibmljaHQgZG9rdW1lbnRpZXJ0In0KICAgICAgICAgICAge3B1Ymxpc2hlZEF0ICYmIHVwZGF0ZWRBdCAmJiBwdWJsaXNoZWRBdCAhPT0gdXBkYXRlZEF0ICYmICgKICAgICAgICAgICAgICA8c21hbGw+RXJzdHZlcsO2ZmZlbnRsaWNodW5nOiB7Zm9ybWF0RGF0ZShwdWJsaXNoZWRBdCl9PC9zbWFsbD4KICAgICAgICAgICAgKX0KICAgICAgICAgIDwvZGQ+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdj4KICAgICAgICAgIDxkdD5QcsO8ZmFydDwvZHQ+CiAgICAgICAgICA8ZGQ+CiAgICAgICAgICAgIHtjdXJyZW50U3RhdHVzPy5sYWJlbCA/PyAiUmVkYWt0aW9uZWxsZSBFaW5vcmRudW5nIn0KICAgICAgICAgICAgPHNtYWxsPgogICAgICAgICAgICAgIHtjdXJyZW50U3RhdHVzPy50ZXh0ID8/CiAgICAgICAgICAgICAgICBgJHtjb250ZW50TGFiZWx9IGF1ZiBCYXNpcyBkZXIgYXVmIGRlciBTZWl0ZSBnZW5hbm50ZW4gRGF0ZW4gdW5kIFF1ZWxsZW4uYH0KICAgICAgICAgICAgPC9zbWFsbD4KICAgICAgICAgIDwvZGQ+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdj4KICAgICAgICAgIDxkdD5GaW5hbnppZXJ1bmc8L2R0PgogICAgICAgICAgPGRkPgogICAgICAgICAgICBBZmZpbGlhdGUtZmluYW56aWVydCwgcmVkYWt0aW9uZWxsIGdldHJlbm50CiAgICAgICAgICAgIDxzbWFsbD5Qcm92aXNpb25lbiB2ZXLDpG5kZXJuIHdlZGVyIFNjb3JlIG5vY2ggUmFuZ2ZvbGdlLiBEZXIgS2F1ZnByZWlzIGJsZWlidCBnbGVpY2guPC9zbWFsbD4KICAgICAgICAgIDwvZGQ+CiAgICAgICAgPC9kaXY+CiAgICAgIDwvZGw+CgogICAgICB7KGV2aWRlbmNlVGV4dCB8fCByZWNvbW1lbmRhdGlvblJlYXNvbikgJiYgKAogICAgICAgIDxkaXYgY2xhc3M9ImVkaXRvcmlhbC10cmFuc3BhcmVuY3lfX2V2aWRlbmNlIj4KICAgICAgICAgIHtldmlkZW5jZVRleHQgJiYgPHA+PHN0cm9uZz5CZXLDvGNrc2ljaHRpZ3RlIE5hY2h3ZWlzZTo8L3N0cm9uZz4ge2V2aWRlbmNlVGV4dH0uPC9wPn0KICAgICAgICAgIHtyZWNvbW1lbmRhdGlvblJlYXNvbiAmJiA8cD48c3Ryb25nPldhcnVtIGRpZXNlIEVtcGZlaGx1bmc6PC9zdHJvbmc+IHtyZWNvbW1lbmRhdGlvblJlYXNvbn08L3A+fQogICAgICAgIDwvZGl2PgogICAgICApfQoKICAgICAgPG5hdiBhcmlhLWxhYmVsPSJSZWRha3Rpb25lbGxlIEluZm9ybWF0aW9uZW4iPgogICAgICAgIDxhIGhyZWY9Ii9zby1iZXdlcnRlbi13aXIvIj5NZXRob2RpayB1bmQgQmV3ZXJ0dW5nc3N5c3RlbTwvYT4KICAgICAgICA8YSBocmVmPSIvcmVkYWt0aW9uLyI+UmVkYWt0aW9uIHVuZCBVbmFiaMOkbmdpZ2tlaXQ8L2E+CiAgICAgICAgPGEgaHJlZj0iL2FmZmlsaWF0ZS1oaW53ZWlzLyI+QWZmaWxpYXRlLU9mZmVubGVndW5nPC9hPgogICAgICAgIDxhIGhyZWY9Ii9rb250YWt0LyI+RmVobGVyIG1lbGRlbjwvYT4KICAgICAgPC9uYXY+CiAgICA8Lz4KICApfQo8L2FzaWRlPgoKPHN0eWxlPgogIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5IHsKICAgIG1hcmdpbjogY2xhbXAoMjRweCwgNXZ3LCA0OHB4KSAwOwogICAgcGFkZGluZzogY2xhbXAoMThweCwgNHZ3LCAzMHB4KTsKICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWNvbG9yLWJvcmRlciwgI2Q3ZTJkYSk7CiAgICBib3JkZXItcmFkaXVzOiAyMnB4OwogICAgYmFja2dyb3VuZDogdmFyKC0tY29sb3Itc3VyZmFjZS1zdWJ0bGUsICNmNWY4ZjUpOwogICAgY29sb3I6IHZhcigtLWNvbG9yLXRleHQsICMxNzIxMWIpOwogIH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9faGVhZGluZyBzcGFuLAogIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5X19jb21wYWN0LWtpY2tlciB7CiAgICBjb2xvcjogdmFyKC0tY29sb3ItcHJpbWFyeSwgIzJlN2QzMik7CiAgICBmb250LXNpemU6IC43NXJlbTsKICAgIGZvbnQtd2VpZ2h0OiA4MDA7CiAgICBsZXR0ZXItc3BhY2luZzogLjA4ZW07CiAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlOwogIH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeSBoMiB7CiAgICBtYXJnaW46IDZweCAwIDE4cHg7CiAgICBmb250LXNpemU6IGNsYW1wKDEuMzVyZW0sIDN2dywgMS44NXJlbSk7CiAgfQogIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5X19mYWN0cyB7CiAgICBkaXNwbGF5OiBncmlkOwogICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoMiwgbWlubWF4KDAsIDFmcikpOwogICAgZ2FwOiAxMnB4OwogICAgbWFyZ2luOiAwOwogIH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fZmFjdHMgPiBkaXYgewogICAgcGFkZGluZzogMTRweDsKICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWNvbG9yLWJvcmRlciwgI2Q3ZTJkYSk7CiAgICBib3JkZXItcmFkaXVzOiAxNHB4OwogICAgYmFja2dyb3VuZDogdmFyKC0tY29sb3Itc3VyZmFjZSwgI2ZmZik7CiAgfQogIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5IGR0IHsKICAgIG1hcmdpbi1ib3R0b206IDVweDsKICAgIGNvbG9yOiB2YXIoLS1jb2xvci10ZXh0LW11dGVkLCAjNWQ2ZDYzKTsKICAgIGZvbnQtc2l6ZTogLjc4cmVtOwogICAgZm9udC13ZWlnaHQ6IDgwMDsKICAgIGxldHRlci1zcGFjaW5nOiAuMDRlbTsKICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7CiAgfQogIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5IGRkIHsgbWFyZ2luOiAwOyBmb250LXdlaWdodDogNzUwOyB9CiAgLmVkaXRvcmlhbC10cmFuc3BhcmVuY3kgZGQgc21hbGwgewogICAgZGlzcGxheTogYmxvY2s7CiAgICBtYXJnaW4tdG9wOiA1cHg7CiAgICBjb2xvcjogdmFyKC0tY29sb3ItdGV4dC1tdXRlZCwgIzVkNmQ2Myk7CiAgICBmb250LXNpemU6IC44NnJlbTsKICAgIGZvbnQtd2VpZ2h0OiA0NTA7CiAgICBsaW5lLWhlaWdodDogMS40NTsKICB9CiAgLmVkaXRvcmlhbC10cmFuc3BhcmVuY3kgYSB7IGNvbG9yOiBpbmhlcml0OyB0ZXh0LXVuZGVybGluZS1vZmZzZXQ6IDNweDsgfQogIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5X19ldmlkZW5jZSB7CiAgICBtYXJnaW4tdG9wOiAxNHB4OwogICAgcGFkZGluZzogMTRweCAxNnB4OwogICAgYm9yZGVyLWxlZnQ6IDRweCBzb2xpZCB2YXIoLS1jb2xvci1wcmltYXJ5LCAjMmU3ZDMyKTsKICAgIGJhY2tncm91bmQ6IHZhcigtLWNvbG9yLXN1cmZhY2UsICNmZmYpOwogIH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fZXZpZGVuY2UgcCB7IG1hcmdpbjogMDsgbGluZS1oZWlnaHQ6IDEuNTU7IH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fZXZpZGVuY2UgcCArIHAgeyBtYXJnaW4tdG9wOiA4cHg7IH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeSBuYXYgewogICAgZGlzcGxheTogZmxleDsKICAgIGZsZXgtd3JhcDogd3JhcDsKICAgIGdhcDogOHB4IDE4cHg7CiAgICBtYXJnaW4tdG9wOiAxNnB4OwogICAgZm9udC1zaXplOiAuOXJlbTsKICAgIGZvbnQtd2VpZ2h0OiA3MDA7CiAgfQoKICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeS0tY29tcGFjdCB7CiAgICBtYXJnaW46IDIycHggMDsKICAgIHBhZGRpbmc6IDA7CiAgICBib3JkZXItcmFkaXVzOiAxNHB4OwogICAgYmFja2dyb3VuZDogdmFyKC0tY29sb3Itc3VyZmFjZSwgI2ZmZik7CiAgfQogIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5X19jb21wYWN0LWRldGFpbHMgc3VtbWFyeSB7CiAgICBkaXNwbGF5OiBmbGV4OwogICAgYWxpZ24taXRlbXM6IGJhc2VsaW5lOwogICAgZmxleC13cmFwOiB3cmFwOwogICAgZ2FwOiA1cHggMTBweDsKICAgIHBhZGRpbmc6IDExcHggMTRweDsKICAgIGN1cnNvcjogcG9pbnRlcjsKICAgIGxpc3Qtc3R5bGU6IG5vbmU7CiAgfQogIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5X19jb21wYWN0LWRldGFpbHMgc3VtbWFyeTo6LXdlYmtpdC1kZXRhaWxzLW1hcmtlciB7CiAgICBkaXNwbGF5OiBub25lOwogIH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fY29tcGFjdC1kZXRhaWxzIHN1bW1hcnk6OmFmdGVyIHsKICAgIGNvbnRlbnQ6ICIrIjsKICAgIG1hcmdpbi1sZWZ0OiBhdXRvOwogICAgY29sb3I6IHZhcigtLWNvbG9yLXRleHQtbXV0ZWQsICM1ZDZkNjMpOwogICAgZm9udC1zaXplOiAxLjA1cmVtOwogICAgZm9udC13ZWlnaHQ6IDcwMDsKICB9CiAgLmVkaXRvcmlhbC10cmFuc3BhcmVuY3lfX2NvbXBhY3QtZGV0YWlsc1tvcGVuXSBzdW1tYXJ5IHsKICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1jb2xvci1ib3JkZXIsICNkN2UyZGEpOwogIH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fY29tcGFjdC1kZXRhaWxzW29wZW5dIHN1bW1hcnk6OmFmdGVyIHsKICAgIGNvbnRlbnQ6ICLiiJIiOwogIH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fY29tcGFjdC1kZXRhaWxzIHN1bW1hcnkgc3Ryb25nIHsKICAgIGZvbnQtc2l6ZTogLjk1cmVtOwogICAgbGluZS1oZWlnaHQ6IDEuMzU7CiAgfQogIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5X19jb21wYWN0LWRldGFpbHMgc3VtbWFyeSBzbWFsbCB7CiAgICBjb2xvcjogdmFyKC0tY29sb3ItdGV4dC1tdXRlZCwgIzVkNmQ2Myk7CiAgICBmb250LXNpemU6IC44MnJlbTsKICAgIGxpbmUtaGVpZ2h0OiAxLjM1OwogIH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fY29tcGFjdC1ib2R5IHsKICAgIGRpc3BsYXk6IGdyaWQ7CiAgICBnYXA6IDhweDsKICAgIHBhZGRpbmc6IDEzcHggMTRweCAxNXB4OwogIH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fY29tcGFjdC1ib2R5IHAgewogICAgbWFyZ2luOiAwOwogICAgY29sb3I6IHZhcigtLWNvbG9yLXRleHQtbXV0ZWQsICM1ZDZkNjMpOwogICAgZm9udC1zaXplOiAuODhyZW07CiAgICBsaW5lLWhlaWdodDogMS41OwogIH0KICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fY29tcGFjdC1ib2R5IHAgc3Ryb25nIHsKICAgIGNvbG9yOiB2YXIoLS1jb2xvci10ZXh0LCAjMTcyMTFiKTsKICB9CiAgLmVkaXRvcmlhbC10cmFuc3BhcmVuY3lfX2NvbXBhY3QtYm9keSBuYXYgewogICAgbWFyZ2luLXRvcDogNHB4OwogICAgZm9udC1zaXplOiAuODRyZW07CiAgfQoKICA6Z2xvYmFsKGh0bWxbZGF0YS10aGVtZT0iZGFyayJdKSAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeSwKICA6Z2xvYmFsKGh0bWwuZGFyaykgLmVkaXRvcmlhbC10cmFuc3BhcmVuY3ksCiAgOmdsb2JhbChib2R5W2RhdGEtdGhlbWU9ImRhcmsiXSkgLmVkaXRvcmlhbC10cmFuc3BhcmVuY3kgewogICAgLS1jb2xvci1zdXJmYWNlLXN1YnRsZTogIzE0MjExOTsKICAgIC0tY29sb3Itc3VyZmFjZTogIzEwMWIxNjsKICAgIC0tY29sb3ItYm9yZGVyOiAjMzA0MTM3OwogICAgLS1jb2xvci10ZXh0OiAjZWVmN2YwOwogICAgLS1jb2xvci10ZXh0LW11dGVkOiAjYjVjNGJhOwogICAgLS1jb2xvci1wcmltYXJ5OiAjNzJkODg5OwogIH0KICBAbWVkaWEgKG1heC13aWR0aDogNjQwcHgpIHsKICAgIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5IHsgYm9yZGVyLXJhZGl1czogMThweDsgfQogICAgLmVkaXRvcmlhbC10cmFuc3BhcmVuY3lfX2ZhY3RzIHsgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnI7IH0KICAgIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5IG5hdiB7IGRpc3BsYXk6IGdyaWQ7IH0KICAgIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5LS1jb21wYWN0IHsgYm9yZGVyLXJhZGl1czogMTJweDsgfQogICAgLmVkaXRvcmlhbC10cmFuc3BhcmVuY3lfX2NvbXBhY3QtZGV0YWlscyBzdW1tYXJ5IHsKICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjsKICAgICAgZ2FwOiA0cHggOHB4OwogICAgICBwYWRkaW5nOiAxMHB4IDEycHg7CiAgICB9CiAgICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fY29tcGFjdC1raWNrZXIgewogICAgICBmbGV4LWJhc2lzOiAxMDAlOwogICAgICBmb250LXNpemU6IC42OHJlbTsKICAgIH0KICAgIC5lZGl0b3JpYWwtdHJhbnNwYXJlbmN5X19jb21wYWN0LWRldGFpbHMgc3VtbWFyeSBzbWFsbCB7CiAgICAgIGRpc3BsYXk6IG5vbmU7CiAgICB9CiAgICAuZWRpdG9yaWFsLXRyYW5zcGFyZW5jeV9fY29tcGFjdC1ib2R5IHsKICAgICAgcGFkZGluZzogMTJweDsKICAgIH0KICB9Cjwvc3R5bGU+Cg==", "base64").toString("utf8");

const guideComponentPattern =
  /<EditorialTransparency(?:(?!<EditorialTransparency)[\s\S])*?kind="ratgeber"(?:(?!<EditorialTransparency)[\s\S])*?\/>/g;

const reindent = (block, spaces) => {
  const lines = block.trim().split(/\r?\n/);
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0);
  const commonIndent = indents.length ? Math.min(...indents) : 0;
  const prefix = " ".repeat(spaces);

  return lines
    .map((line) => line.trim() ? prefix + line.slice(commonIndent) : "")
    .join("\n");
};

const moveGuideTransparency = (source) => {
  const matches = source.match(guideComponentPattern) ?? [];

  if (matches.length !== 1) {
    throw new Error(
      `Erwartet wurde genau eine Ratgeber-Transparenzkomponente, gefunden: ${matches.length}.`
    );
  }

  const alreadyAtEnd =
    /<EditorialTransparency(?:(?!<EditorialTransparency)[\s\S])*?kind="ratgeber"(?:(?!<EditorialTransparency)[\s\S])*?\/>\s*<FAQ items=\{assembledPage\.faq\} \/>/.test(source);

  if (alreadyAtEnd) return source;

  const topPattern =
    /(\n\s*<\/header>\s*\n)(\s*<EditorialTransparency(?:(?!<EditorialTransparency)[\s\S])*?kind="ratgeber"(?:(?!<EditorialTransparency)[\s\S])*?\/>\s*\n)(\s*<figure class="article-hero">)/;

  const topMatch = source.match(topPattern);
  if (!topMatch) {
    throw new Error(
      "Die Transparenzkomponente steht weder am erwarteten alten Platz noch am neuen Inhaltsabschluss."
    );
  }

  const movedBlock = reindent(topMatch[2], 4);
  let next = source.replace(topPattern, `$1\n$3`);

  const faqAnchor = /\n(\s*)<FAQ items=\{assembledPage\.faq\} \/>/;
  if (!faqAnchor.test(next)) {
    throw new Error("FAQ-Anker zum Einfügen der Transparenzkomponente nicht gefunden.");
  }

  next = next.replace(
    faqAnchor,
    (_match, indent) => `\n${movedBlock}\n${indent}<FAQ items={assembledPage.faq} />`
  );

  return next;
};

const oldAuditBlock = `requirePattern(
  "src/pages/[slug].astro",
  /<EditorialTransparency[\\s\\S]*?kind="ratgeber"/,
  "Ratgeber zeigen die redaktionelle Transparenz"
);`;

const newAuditBlock = `requirePattern(
  "src/pages/[slug].astro",
  /<Content \\/>[\\s\\S]*?<EditorialTransparency[\\s\\S]*?kind="ratgeber"[\\s\\S]*?<FAQ items=\\{assembledPage\\.faq\\} \\/>/,
  "Ratgeber zeigen die redaktionelle Transparenz nach dem Hauptinhalt und vor dem FAQ"
);
requirePattern(
  "src/components/EditorialTransparency.astro",
  /isCompactGuide[\\s\\S]*?editorial-transparency--compact[\\s\\S]*?<details/,
  "Ratgeber nutzen die kompakte, einklappbare Transparenzdarstellung"
);`;

const updateAudit = (source) => {
  if (source.includes("Ratgeber nutzen die kompakte, einklappbare Transparenzdarstellung")) {
    return source;
  }

  if (!source.includes(oldAuditBlock)) {
    if (force) {
      console.warn(`[${PATCH_NAME}] Audit-Struktur unbekannt, Audit-Datei bleibt mit --force unverändert.`);
      return source;
    }

    throw new Error(
      "Das Editorial-Transparency-Audit entspricht nicht der erwarteten Architektur. Nutze --force nur nach Prüfung."
    );
  }

  return source.replace(oldAuditBlock, newAuditBlock);
};

if (
  original.component !== componentTarget &&
  !force &&
  !(
    original.component.includes('type ContentKind = "ratgeber" | "produkt" | "vergleich";') &&
    original.component.includes('<dl class="editorial-transparency__facts">') &&
    original.component.includes('class="editorial-transparency"')
  )
) {
  console.error(`[${PATCH_NAME}] EditorialTransparency.astro weicht von der erwarteten Architektur ab.`);
  console.error("Abbruch, damit keine parallelen Änderungen überschrieben werden. Nutze --force nur nach Prüfung.");
  process.exit(1);
}

let next;
try {
  next = {
    page: moveGuideTransparency(original.page),
    component: componentTarget,
    audit: updateAudit(original.audit)
  };
} catch (error) {
  console.error(`[${PATCH_NAME}] Vorprüfung fehlgeschlagen: ${error.message}`);
  process.exit(1);
}

const guideMatches = next.page.match(guideComponentPattern) ?? [];
const heroStart = next.page.indexOf('<figure class="article-hero">');
const guideStart = next.page.indexOf("<EditorialTransparency", heroStart);
const faqStart = next.page.indexOf("<FAQ items={assembledPage.faq} />");
const compactIsValid =
  next.component.includes('const isCompactGuide = kind === "ratgeber";') &&
  next.component.includes('class="editorial-transparency__compact-details"') &&
  next.component.includes("<strong>Prüfart:</strong>");

if (
  guideMatches.length !== 1 ||
  heroStart < 0 ||
  guideStart < heroStart ||
  faqStart < 0 ||
  guideStart > faqStart ||
  !compactIsValid
) {
  console.error(`[${PATCH_NAME}] Interne Validierung fehlgeschlagen. Es wurde noch nichts geschrieben.`);
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(repoRoot, ".patch-backups", `${PATCH_NAME}-${timestamp}`);
const changed = Object.keys(files).filter((key) => next[key] !== original[key]);

if (!changed.length) {
  console.log(`[${PATCH_NAME}] Bereits vollständig installiert.`);
  process.exit(0);
}

fs.mkdirSync(backupRoot, { recursive: true });
for (const key of changed) {
  const relative = path.relative(repoRoot, files[key]);
  const backup = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.writeFileSync(backup, original[key], "utf8");
}

const restore = () => {
  for (const key of changed) {
    fs.writeFileSync(files[key], original[key], "utf8");
  }
};

try {
  for (const key of changed) {
    fs.writeFileSync(files[key], next[key], "utf8");
    console.log(`[${PATCH_NAME}] Geändert: ${path.relative(repoRoot, files[key])}`);
  }

  if (!skipAudit) {
    const result = spawnSync(
      process.execPath,
      [path.relative(repoRoot, files.audit)],
      {
        cwd: repoRoot,
        stdio: "inherit",
        shell: false
      }
    );

    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Editorial-Transparency-Audit fehlgeschlagen (Exit ${result.status}).`);
    }
  }
} catch (error) {
  restore();
  console.error(`[${PATCH_NAME}] Fehler: ${error.message}`);
  console.error("Alle geänderten Dateien wurden zurückgesetzt.");
  process.exit(1);
}

console.log("");
console.log(`[${PATCH_NAME}] Abgeschlossen.`);
console.log(`Backups: ${path.relative(repoRoot, backupRoot)}`);
console.log("Ratgeber: Transparenz nach dem Hauptinhalt, vor dem FAQ, kompakt und einklappbar.");
console.log("Autor und Aktualisierungsdatum bleiben ausschließlich im ArticleMeta am Seitenanfang.");
console.log("");
console.log("Empfohlene Prüfung:");
console.log("npm --workspace apps/pfotentechnik run build");
