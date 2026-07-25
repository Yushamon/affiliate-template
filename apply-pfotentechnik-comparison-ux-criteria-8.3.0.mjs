#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-comparison-ux-criteria-8.3.0";
const SUMMARY = Buffer.from("LS0tCmltcG9ydCB0eXBlIHsKICBDb21wYXJpc29uUHJvZHVjdCwKICBDb21wYXJpc29uUm93Cn0gZnJvbSAiLi4vLi4vY29tcGFyaXNvbi9tb2RlbCI7Cgp0eXBlIFByb3BzID0gewogIHByb2R1Y3RzOiBDb21wYXJpc29uUHJvZHVjdFtdOwogIHJvd3M6IENvbXBhcmlzb25Sb3dbXTsKfTsKCmNvbnN0IHsgcHJvZHVjdHMsIHJvd3MgfSA9IEFzdHJvLnByb3BzIGFzIFByb3BzOwoKY29uc3Qgbm9ybWFsaXplID0gKHZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQpID0+CiAgKHZhbHVlID8/ICIiKS50cmltKCkudG9Mb2NhbGVMb3dlckNhc2UoImRlLURFIik7Cgpjb25zdCBtZWFuaW5nZnVsUm93cyA9IHJvd3MuZmlsdGVyKChyb3cpID0+IHsKICBjb25zdCB2YWx1ZXMgPSByb3cuY2VsbHMKICAgIC5tYXAoKGNlbGwpID0+IG5vcm1hbGl6ZShjZWxsLnZhbHVlKSkKICAgIC5maWx0ZXIoCiAgICAgICh2YWx1ZSkgPT4KICAgICAgICB2YWx1ZSAmJgogICAgICAgIHZhbHVlICE9PSAi4oCTIiAmJgogICAgICAgIHZhbHVlICE9PSAia2VpbmUgYW5nYWJlIgogICAgKTsKCiAgcmV0dXJuIG5ldyBTZXQodmFsdWVzKS5zaXplID4gMTsKfSk7Cgpjb25zdCBjb21wbGV0ZVJvd3MgPSByb3dzLmZpbHRlcigocm93KSA9PgogIHJvdy5jZWxscy5ldmVyeSgoY2VsbCkgPT4gewogICAgY29uc3QgdmFsdWUgPSBub3JtYWxpemUoY2VsbC52YWx1ZSk7CgogICAgcmV0dXJuICgKICAgICAgdmFsdWUgJiYKICAgICAgdmFsdWUgIT09ICLigJMiICYmCiAgICAgIHZhbHVlICE9PSAia2VpbmUgYW5nYWJlIgogICAgKTsKICB9KQopOwoKY29uc3Qgc3Ryb25nZXN0RGlmZmVyZW5jZXMgPSBtZWFuaW5nZnVsUm93cy5zbGljZSgwLCA0KTsKY29uc3QgcmF0ZWRQcm9kdWN0cyA9IHByb2R1Y3RzLmZpbHRlcigKICAocHJvZHVjdCkgPT4gdHlwZW9mIHByb2R1Y3QucmF0aW5nID09PSAibnVtYmVyIgopOwpjb25zdCB0b3BSYXRlZCA9IFsuLi5yYXRlZFByb2R1Y3RzXS5zb3J0KAogIChhLCBiKSA9PiAoYi5yYXRpbmcgPz8gMCkgLSAoYS5yYXRpbmcgPz8gMCkKKVswXTsKCmNvbnN0IGNvbXBsZXRlbmVzcyA9IHJvd3MubGVuZ3RoID4gMAogID8gTWF0aC5yb3VuZCgoY29tcGxldGVSb3dzLmxlbmd0aCAvIHJvd3MubGVuZ3RoKSAqIDEwMCkKICA6IDA7Cgpjb25zdCBoYXNDcml0ZXJpYSA9IHJvd3MubGVuZ3RoID4gMDsKLS0tCgp7aGFzQ3JpdGVyaWEgJiYgKAogIDxzZWN0aW9uCiAgICBjbGFzcz0iY29tcGFyaXNvbi1pbnNpZ2h0LXN1bW1hcnkiCiAgICBhcmlhLWxhYmVsbGVkYnk9ImNvbXBhcmlzb24taW5zaWdodC10aXRsZSIKICA+CiAgICA8ZGl2IGNsYXNzPSJjb21wYXJpc29uLWluc2lnaHQtc3VtbWFyeV9faW50cm8iPgogICAgICA8c3BhbiBjbGFzcz0iY29tcGFyaXNvbi1leWVicm93Ij4KICAgICAgICBSZWRha3Rpb25lbGxlIEVpbm9yZG51bmcKICAgICAgPC9zcGFuPgoKICAgICAgPGgyIGlkPSJjb21wYXJpc29uLWluc2lnaHQtdGl0bGUiPgogICAgICAgIFdhcyBkaWUgTW9kZWxsZSB3aXJrbGljaCB1bnRlcnNjaGVpZGV0CiAgICAgIDwvaDI+CgogICAgICA8cD4KICAgICAgICB7bWVhbmluZ2Z1bFJvd3MubGVuZ3RoID4gMAogICAgICAgICAgPyBgQmVpICR7bWVhbmluZ2Z1bFJvd3MubGVuZ3RofSB2b24gJHtyb3dzLmxlbmd0aH0gVmVyZ2xlaWNoc2tyaXRlcmllbiBnaWJ0IGVzIGVya2VubmJhcmUgVW50ZXJzY2hpZWRlLiBFbnRzY2hlaWRlbmQgc2luZCBkYWhlciBuaWNodCBtw7ZnbGljaHN0IHZpZWxlIEZ1bmt0aW9uZW4sIHNvbmRlcm4gZGllIE1lcmttYWxlLCBkaWUgenUgZGVpbmVtIEhhdXNoYWx0IHVuZCBBbGx0YWcgcGFzc2VuLmAKICAgICAgICAgIDogYERpZSBlcmZhc3N0ZW4gS3JpdGVyaWVuIHplaWdlbiBkZXJ6ZWl0IG51ciBnZXJpbmdlIFVudGVyc2NoaWVkZS4gTnV0emUgZGVuIERpcmVrdHZlcmdsZWljaCBkZXNoYWxiIHZvciBhbGxlbSwgdW0gUGFzc2Zvcm0sIEJlZGllbnVuZyB1bmQgZGllIGtvbmtyZXRlbiBFaW5zYXR6Z3JlbnplbiBkZXIgTW9kZWxsZSB6dSBwcsO8ZmVuLmB9CiAgICAgIDwvcD4KICAgIDwvZGl2PgoKICAgIDxkaXYgY2xhc3M9ImNvbXBhcmlzb24taW5zaWdodC1zdW1tYXJ5X19ncmlkIj4KICAgICAge21lYW5pbmdmdWxSb3dzLmxlbmd0aCA+IDAgJiYgKAogICAgICAgIDxhcnRpY2xlPgogICAgICAgICAgPHNwYW4KICAgICAgICAgICAgY2xhc3M9ImNvbXBhcmlzb24taW5zaWdodC1zdW1tYXJ5X19pY29uIgogICAgICAgICAgICBhcmlhLWhpZGRlbj0idHJ1ZSIKICAgICAgICAgID4KICAgICAgICAgICAg4omgCiAgICAgICAgICA8L3NwYW4+CiAgICAgICAgICA8c3Ryb25nPnttZWFuaW5nZnVsUm93cy5sZW5ndGh9PC9zdHJvbmc+CiAgICAgICAgICA8c3Bhbj5lbnRzY2hlaWR1bmdzcmVsZXZhbnRlIFVudGVyc2NoaWVkZTwvc3Bhbj4KICAgICAgICA8L2FydGljbGU+CiAgICAgICl9CgogICAgICB7Y29tcGxldGVSb3dzLmxlbmd0aCA+IDAgJiYgKAogICAgICAgIDxhcnRpY2xlPgogICAgICAgICAgPHNwYW4KICAgICAgICAgICAgY2xhc3M9ImNvbXBhcmlzb24taW5zaWdodC1zdW1tYXJ5X19pY29uIgogICAgICAgICAgICBhcmlhLWhpZGRlbj0idHJ1ZSIKICAgICAgICAgID4KICAgICAgICAgICAg4pyTCiAgICAgICAgICA8L3NwYW4+CiAgICAgICAgICA8c3Ryb25nPntjb21wbGV0ZW5lc3N9JTwvc3Ryb25nPgogICAgICAgICAgPHNwYW4+dm9sbHN0w6RuZGlnIGJlbGVndGUgS3JpdGVyaWVuPC9zcGFuPgogICAgICAgIDwvYXJ0aWNsZT4KICAgICAgKX0KCiAgICAgIDxhcnRpY2xlPgogICAgICAgIDxzcGFuCiAgICAgICAgICBjbGFzcz0iY29tcGFyaXNvbi1pbnNpZ2h0LXN1bW1hcnlfX2ljb24iCiAgICAgICAgICBhcmlhLWhpZGRlbj0idHJ1ZSIKICAgICAgICA+CiAgICAgICAgICAjCiAgICAgICAgPC9zcGFuPgogICAgICAgIDxzdHJvbmc+e3Byb2R1Y3RzLmxlbmd0aH08L3N0cm9uZz4KICAgICAgICA8c3Bhbj5Nb2RlbGxlIGltIFZlcmdsZWljaDwvc3Bhbj4KICAgICAgPC9hcnRpY2xlPgogICAgPC9kaXY+CgogICAgeyhzdHJvbmdlc3REaWZmZXJlbmNlcy5sZW5ndGggPiAwIHx8IHRvcFJhdGVkKSAmJiAoCiAgICAgIDxkaXYgY2xhc3M9ImNvbXBhcmlzb24taW5zaWdodC1zdW1tYXJ5X19kZXRhaWxzIj4KICAgICAgICB7c3Ryb25nZXN0RGlmZmVyZW5jZXMubGVuZ3RoID4gMCAmJiAoCiAgICAgICAgICA8ZGl2PgogICAgICAgICAgICA8aDM+RGFyYXVmIGtvbW10IGVzIGJlc29uZGVycyBhbjwvaDM+CgogICAgICAgICAgICA8dWw+CiAgICAgICAgICAgICAge3N0cm9uZ2VzdERpZmZlcmVuY2VzLm1hcCgocm93KSA9PiAoCiAgICAgICAgICAgICAgICA8bGk+CiAgICAgICAgICAgICAgICAgIDxhIGhyZWY9IiNkaXJla3R2ZXJnbGVpY2giPgogICAgICAgICAgICAgICAgICAgIHtyb3cuY3JpdGVyaW9uLmxhYmVsfQogICAgICAgICAgICAgICAgICA8L2E+CgogICAgICAgICAgICAgICAgICB7cm93LmNyaXRlcmlvbi5kZXNjcmlwdGlvbiAmJiAoCiAgICAgICAgICAgICAgICAgICAgPHNwYW4+CiAgICAgICAgICAgICAgICAgICAgICB7cm93LmNyaXRlcmlvbi5kZXNjcmlwdGlvbn0KICAgICAgICAgICAgICAgICAgICA8L3NwYW4+CiAgICAgICAgICAgICAgICAgICl9CiAgICAgICAgICAgICAgICA8L2xpPgogICAgICAgICAgICAgICkpfQogICAgICAgICAgICA8L3VsPgogICAgICAgICAgPC9kaXY+CiAgICAgICAgKX0KCiAgICAgICAge3RvcFJhdGVkICYmICgKICAgICAgICAgIDxhc2lkZT4KICAgICAgICAgICAgPHNwYW4+SMO2Y2hzdGVyIHJlZGFrdGlvbmVsbGVyIFNjb3JlPC9zcGFuPgogICAgICAgICAgICA8c3Ryb25nPnt0b3BSYXRlZC50aXRsZX08L3N0cm9uZz4KCiAgICAgICAgICAgIDxwPgogICAgICAgICAgICAgIHtNYXRoLnJvdW5kKHRvcFJhdGVkLnJhdGluZyA/PyAwKX0gdm9uIDEwMAogICAgICAgICAgICAgIFB1bmt0ZW4uIERlciBTY29yZSBpc3QgZWluZSBPcmllbnRpZXJ1bmcgdW5kCiAgICAgICAgICAgICAgZXJzZXR6dCBuaWNodCBkaWUgUHLDvGZ1bmcsIG9iIGRhcyBNb2RlbGwgenUKICAgICAgICAgICAgICBkZWluZW0ga29ua3JldGVuIEVpbnNhdHogcGFzc3QuCiAgICAgICAgICAgIDwvcD4KCiAgICAgICAgICAgIDxhIGhyZWY9e3RvcFJhdGVkLmhyZWZ9PgogICAgICAgICAgICAgIFByb2R1a3RkZXRhaWxzIGFuc2VoZW4KICAgICAgICAgICAgPC9hPgogICAgICAgICAgPC9hc2lkZT4KICAgICAgICApfQogICAgICA8L2Rpdj4KICAgICl9CiAgPC9zZWN0aW9uPgopfQo=", "base64").toString("utf8");
const GPS = Buffer.from("LS0tCnRpdGxlOiAiQmVzdGUgR1BTLVRyYWNrZXIgZsO8ciBLYXR6ZW4iCnNsdWc6ICJiZXN0ZS1ncHMtdHJhY2tlci1mdWVyLWthdHplbiIKdHlwZTogImNvbXBhcmlzb24iCmxheW91dDogImNvbXBhcmlzb24iCmRlc2NyaXB0aW9uOiAiR1BTLVRyYWNrZXIgZsO8ciBLYXR6ZW4gbmFjaCBQYXNzZm9ybSwgU2ljaGVyaGVpdHNoYWxzYmFuZCwgR2V3aWNodCwgQWtrdSwgQWJvLCBXYXNzZXJzY2h1dHogdW5kIE9ydHVuZyB2ZXJnbGVpY2hlbi4iCnB1Ymxpc2hlZEF0OiAiMjAyNi0wNy0yMCIKdXBkYXRlZEF0OiAiMjAyNi0wNy0yNSIKYXV0aG9yOgogIG5hbWU6ICJQZm90ZW5UZWNobmlrIFJlZGFrdGlvbiIKICByb2xlOiAiUmVkYWt0aW9uIgpjb21wYXJpc29uVHlwZTogInVzZS1jYXNlIgpncm91cDogIkdQUy1UcmFja2VyIgppY29uOiAi8J+QiCIKYXV0b21hdGljUmVjb21tZW5kYXRpb25zOgogIGVuYWJsZWQ6IHRydWUKaXRlbXM6CiAgLSBzbHVnOiAidHJhY3RpdmUtY2F0LTYtbWluaSIKICAgIHR5cGU6ICJwcm9kdWN0IgogICAgbGFiZWw6ICJUcmFjdGl2ZSBDQVQgNiBNaW5pIgogICAgcmVjb21tZW5kYXRpb246ICJBdXNnZXdvZ2Vuc3RlIGthdHplbnNwZXppZmlzY2hlIEtvbXBsZXR0bMO2c3VuZyBtaXQgaW50ZWdyaWVydGVtIFNpY2hlcmhlaXRzaGFsc2JhbmQuIgogICAgdmFsdWVzOgogICAgICBwcm9maWw6ICJCZXN0ZSBrYXR6ZW5zcGV6aWZpc2NoZSBLb21wbGV0dGzDtnN1bmciCiAgICAgIGVpZ251bmc6ICJLYXR6ZW4gdm9uIDMgYmlzIDgga2c7IEhhbHN1bWZhbmcgMTkgYmlzIDIyLDkgY20iCiAgICAgIGdld2ljaHQ6ICIzMiBnIGlua2x1c2l2ZSBIYWxzYmFuZCIKICAgICAgYmVmZXN0aWd1bmc6ICJJbnRlZ3JpZXJ0ZXMgU2ljaGVyaGVpdHNoYWxzYmFuZCBtaXQgw5ZmZm51bmcgdW50ZXIgWnVnIgogICAgICBvcnR1bmc6ICJHUFMsIEdMT05BU1MgdW5kIEdhbGlsZW87IMOcYmVydHJhZ3VuZyBwZXIgTFRFLzRHIgogICAgICBha2t1bGF1ZnplaXQ6ICJCaXMgNyBUYWdlIG1pdCBFbmVyZ2llc3BhcnpvbmU7IGJpcyA0IFRhZ2Ugb2huZSIKICAgICAgYWJvOiAiQWIgZGVtIGVyc3RlbiBOdXR6dW5nc3RhZyBlcmZvcmRlcmxpY2giCiAgICAgIHdhc3NlcnNjaHV0ejogIklQNjgiCgogIC0gc2x1ZzogIndlZW5lY3QteHMiCiAgICB0eXBlOiAicHJvZHVjdCIKICAgIGxhYmVsOiAiV2VlbmVjdCBYUyIKICAgIHJlY29tbWVuZGF0aW9uOiAiTGVpY2h0ZXN0ZSByZWluZSBHZXLDpHRlb3B0aW9uIGbDvHIgS2F0emVuIGFiIDMga2cgbWl0IGZsZXhpYmxlciBCZWZlc3RpZ3VuZyB1bmQgUsO8Y2tydWZzaWduYWxlbi4iCiAgICB2YWx1ZXM6CiAgICAgIHByb2ZpbDogIkxlaWNodGVzdGVzIEdlcsOkdCBpbSBWZXJnbGVpY2giCiAgICAgIGVpZ251bmc6ICJLYXR6ZW4gYWIgMyBrZyIKICAgICAgZ2V3aWNodDogIjI3IGcgR2Vyw6R0ZWdld2ljaHQiCiAgICAgIGJlZmVzdGlndW5nOiAiU2lsaWtvbmhhbHRlcjsgS2F0emVudmVyc2lvbiBtaXQgQW50aS1TdHJhbmd1bGF0aW9ucy1FbGFzdGlrYmFuZCIKICAgICAgb3J0dW5nOiAiR1BTLCBHYWxpbGVvLCBCZWlEb3UgdW5kIEdMT05BU1M7IE1vYmlsZnVuayBwZXIgNUcsIDRHIHVuZCAyRyIKICAgICAgYWtrdWxhdWZ6ZWl0OiAiQmlzIDcgVGFnZSBtaXQgV0xBTi1ab25lOyBldHdhIDIgVGFnZSBiZWkga29udGludWllcmxpY2hlbSBUcmFja2luZyIKICAgICAgYWJvOiAiRWlnZW5lcyBBYm8gcHJvIFRyYWNrZXIgZXJmb3JkZXJsaWNoIgogICAgICB3YXNzZXJzY2h1dHo6ICJJUDY4IgoKICAtIHNsdWc6ICJwYWotcGV0LWZpbmRlci00Zy1taW5pIgogICAgdHlwZTogInByb2R1Y3QiCiAgICBsYWJlbDogIlBBSiBQRVQgRmluZGVyIDRHIE1pbmkiCiAgICByZWNvbW1lbmRhdGlvbjogIktvc3Rlbm9yaWVudGllcnRlIEFsdGVybmF0aXZlIG1pdCAyNyBlbnRoYWx0ZW5lbiBTZXJ2aWNlbW9uYXRlbiwgYWJlciB3ZW5pZ2VyIGtsYXJlciBLYXR6ZW5laWdudW5nLiIKICAgIHZhbHVlczoKICAgICAgcHJvZmlsOiAiQmVzdGUgZW50aGFsdGVuZSBTZXJ2aWNlcGhhc2UiCiAgICAgIGVpZ251bmc6ICJGw7xyIGdyw7bDn2VyZSBLYXR6ZW4gbnVyIG5hY2ggZ2VuYXVlciBQYXNzZm9ybXByw7xmdW5nOyBIZXJzdGVsbGVyaGlud2VpcyBldHdhIGFiIDQga2ciCiAgICAgIGdld2ljaHQ6ICIzMywxIGcgR2Vyw6R0ZWdld2ljaHQiCiAgICAgIGJlZmVzdGlndW5nOiAiR3VtbWktSGFsc2JhbmRiZWZlc3RpZ3VuZ2VuOyBTaWNoZXJoZWl0c2zDtnN1bmcgc2VwYXJhdCBwcsO8ZmVuIgogICAgICBvcnR1bmc6ICJHUFMgdW5kIDRHL0xURTsgZXJnw6RuemVuZCBCbHVldG9vdGggdW5kIFdMQU4iCiAgICAgIGFra3VsYXVmemVpdDogIkJpcyAxMCBUYWdlIGltIEVuZXJnaWVzcGFybW9kdXM7IGV0d2EgMSBiaXMgMiBUYWdlIGJlaSBrb250aW51aWVybGljaGVtIFRyYWNraW5nIgogICAgICBhYm86ICIyNyBNb25hdGUgZW50aGFsdGVuOyBkYW5hY2gga29zdGVucGZsaWNodGlnZXIgVGFyaWYiCiAgICAgIHdhc3NlcnNjaHV0ejogIklQNjciCgpjcml0ZXJpYToKICAtIGtleTogInByb2ZpbCIKICAgIGxhYmVsOiAiVW5zZXJlIEVpbm9yZG51bmciCiAgICBkZXNjcmlwdGlvbjogIkRlciBzdMOkcmtzdGUga29ua3JldGUgQW53ZW5kdW5nc2ZhbGwgZGVzIE1vZGVsbHMuIgogICAgd2VpZ2h0OiAxLjMKICAtIGtleTogImVpZ251bmciCiAgICBsYWJlbDogIkthdHplbmVpZ251bmcgdW5kIFBhc3Nmb3JtIgogICAgZGVzY3JpcHRpb246ICJHZXdpY2h0c2JlcmVpY2gsIEhhbHN1bWZhbmcgdW5kIEdyZW56ZW4gZGVyIGRva3VtZW50aWVydGVuIEVpZ251bmcuIgogICAgd2VpZ2h0OiAxLjYKICAtIGtleTogImdld2ljaHQiCiAgICBsYWJlbDogIkdld2ljaHQiCiAgICBkZXNjcmlwdGlvbjogIkdlcsOkdGVnZXdpY2h0IG9kZXIgR2VzYW10Z2V3aWNodCBpbmtsdXNpdmUgSGFsc2JhbmQuIgogICAgd2VpZ2h0OiAxLjQKICAtIGtleTogImJlZmVzdGlndW5nIgogICAgbGFiZWw6ICJCZWZlc3RpZ3VuZyB1bmQgU2ljaGVyaGVpdCIKICAgIGRlc2NyaXB0aW9uOiAiSGFsc2JhbmRsw7ZzdW5nLCBIYWx0ZXJ1bmcgdW5kIFNjaHV0eiB2b3IgU3RyYW5ndWxhdGlvbi4iCiAgICB3ZWlnaHQ6IDEuNgogIC0ga2V5OiAib3J0dW5nIgogICAgbGFiZWw6ICJPcnR1bmcgdW5kIMOcYmVydHJhZ3VuZyIKICAgIGRlc2NyaXB0aW9uOiAiU2F0ZWxsaXRlbnN5c3RlbWUgdW5kIERhdGVuw7xiZXJ0cmFndW5nIHp1ciBBcHAuIgogICAgd2VpZ2h0OiAxLjIKICAtIGtleTogImFra3VsYXVmemVpdCIKICAgIGxhYmVsOiAiQWtrdWxhdWZ6ZWl0IgogICAgZGVzY3JpcHRpb246ICJIZXJzdGVsbGVyd2VydGUgdW5kIEJlZGluZ3VuZ2VuLCB1bnRlciBkZW5lbiBzaWUgZ2VsdGVuLiIKICAgIHdlaWdodDogMS4yCiAgLSBrZXk6ICJhYm8iCiAgICBsYWJlbDogIkFibyB1bmQgZW50aGFsdGVuZXIgRGllbnN0IgogICAgZGVzY3JpcHRpb246ICJPYiB1bmQgYWIgd2FubiBsYXVmZW5kZSBLb3N0ZW4gZsO8ciBkaWUgTW9iaWxmdW5rw7xiZXJ0cmFndW5nIGVudHN0ZWhlbi4iCiAgICB3ZWlnaHQ6IDEuMQogIC0ga2V5OiAid2Fzc2Vyc2NodXR6IgogICAgbGFiZWw6ICJXYXNzZXJzY2h1dHoiCiAgICBkZXNjcmlwdGlvbjogIkRva3VtZW50aWVydGUgSVAtU2NodXR6a2xhc3NlIGRlcyBUcmFja2Vycy4iCiAgICB3ZWlnaHQ6IDAuOAoKcmVjb21tZW5kYXRpb246CiAgd2lubmVyU2x1ZzogInRyYWN0aXZlLWNhdC02LW1pbmkiCiAgYWx0ZXJuYXRpdmVTbHVnOiAid2VlbmVjdC14cyIKICB0aXRsZTogIlBhc3Nmb3JtIHVuZCBTaWNoZXJoZWl0IHNpbmQgd2ljaHRpZ2VyIGFscyBqZWRlcyBHcmFtbSIKICB0ZXh0OiAiVHJhY3RpdmUgQ0FUIDYgTWluaSBpc3QgZGllIGF1c2dld29nZW5zdGUga2F0emVuc3BlemlmaXNjaGUgS29tcGxldHRsw7ZzdW5nLiBXZWVuZWN0IFhTIGlzdCBsZWljaHRlciB1bmQgZmxleGlibGVyIGJlZmVzdGlnYmFyLiBEZXIgUEFKIFBFVCBGaW5kZXIgYmlldGV0IGRpZSBsw6RuZ3N0ZSBlbnRoYWx0ZW5lIFNlcnZpY2VwaGFzZSwgaXN0IGbDvHIgS2F0emVuIGFiZXIgd2VuaWdlciBlaW5kZXV0aWcgc3BlemlmaXppZXJ0LiIKdGFibGVUaXRsZTogIkRyZWkgR1BTLVRyYWNrZXIgZsO8ciBLYXR6ZW4gaW0gRGlyZWt0dmVyZ2xlaWNoIgpjYXJkc1RpdGxlOiAiRGllIHN0w6Rya3N0ZW4gTW9kZWxsZSBuYWNoIEVpbnNhdHpwcm9maWwiCmZhcTogW10KLS0tCgojIEJlc3RlIEdQUy1UcmFja2VyIGbDvHIgS2F0emVuCgpCZWkgS2F0emVuIGlzdCAqKm5pY2h0IGRlciBGdW5rdGlvbnN1bWZhbmcqKiwgc29uZGVybiBkaWUgKipzaWNoZXJlIFBhc3Nmb3JtKiogZW50c2NoZWlkZW5kLiBFaW4gVHJhY2tlciBkYXJmIGRpZSBuYXTDvHJsaWNoZSBCZXdlZ3VuZyBuaWNodCBiZWVpbnRyw6RjaHRpZ2VuIHVuZCBzb2xsdGUgbnVyIG1pdCBlaW5lbSBnZWVpZ25ldGVuIFNpY2hlcmhlaXRzaGFsc2JhbmQgb2RlciBlaW5lciBuYWNod2Vpc2xpY2ggc2ljaGVyZW4gQW50aS1TdHJhbmd1bGF0aW9uc2zDtnN1bmcgdmVyd2VuZGV0IHdlcmRlbi4KCiMjIFNjaG5lbGxlbnRzY2hlaWR1bmcgaW4gMzAgU2VrdW5kZW4KCi0gKipUcmFjdGl2ZSBDQVQgNiBNaW5pKiog4oCTIGRpZSBhdXNnZXdvZ2Vuc3RlIGthdHplbnNwZXppZmlzY2hlIEtvbXBsZXR0bMO2c3VuZy4KLSAqKldlZW5lY3QgWFMqKiDigJMgZGFzIGxlaWNodGVzdGUgcmVpbmUgR2Vyw6R0IG1pdCBmbGV4aWJsZXIgQmVmZXN0aWd1bmcuCi0gKipQQUogUEVUIEZpbmRlciA0RyBNaW5pKiog4oCTIGludGVyZXNzYW50IHdlZ2VuIGRlciBlbnRoYWx0ZW5lbiBTZXJ2aWNlcGhhc2UsIGFiZXIgbnVyIG5hY2ggYmVzb25kZXJzIGdlbmF1ZXIgUGFzc2Zvcm1wcsO8ZnVuZy4KCiMjIFdvcmF1ZiBrb21tdCBlcyB3aXJrbGljaCBhbj8KCkVudHNjaGVpZGVuZCBzaW5kIEdlc2FtdGdld2ljaHQsIEvDtnJwZXJnZXdpY2h0IHVuZCBIYWxzdW1mYW5nIGRlciBLYXR6ZSwgU2ljaGVyaGVpdHN2ZXJzY2hsdXNzLCBHZWjDpHVzZWdyw7bDn2UsIE1vYmlsZnVua2FiZGVja3VuZywgcmVhbGUgQWtrdWxhdWZ6ZWl0IHVuZCBsYXVmZW5kZSBLb3N0ZW4uCgojIyBBaXJUYWcgb2RlciBHUFMtVHJhY2tlcj8KCkVpbiBBaXJUYWcgaXN0ICoqa2VpbiB2b2xsd2VydGlnZXIgR1BTLVRyYWNrZXIqKi4gRXIgbnV0enQgQXBwbGVzIOKAnldvIGlzdD/igJwtTmV0endlcmsgdW5kIGZ1bmt0aW9uaWVydCBncnVuZHPDpHR6bGljaCBhbmRlcnMgYWxzIGVpbiBNb2JpbGZ1bmstR1BTLVRyYWNrZXIuCgojIyBTaWNoZXJoZWl0IHZvciBGdW5rdGlvbnN1bWZhbmcKCkVpbmUgRnJlaWfDpG5nZXJrYXR6ZSBzb2xsdGUgbnVyIGVpbmUgQmVmZXN0aWd1bmcgdHJhZ2VuLCBkaWUgc2ljaCBiZWkgZ2Vmw6RocmxpY2hlbSBadWcgbMO2c2VuIGthbm4uIEdlaHQgZGVyIFRyYWNrZXIgZGFkdXJjaCB2ZXJsb3JlbiwgaXN0IGRhcyBpbSBad2VpZmVsIHNpY2hlcmVyIGFscyBlaW4gSMOkbmdlbmJsZWliZW4uCgojIyBBa2t1bGF1ZnplaXQgcmljaHRpZyBlaW5vcmRuZW4KCkhlcnN0ZWxsZXIgbmVubmVuIE1heGltYWx3ZXJ0ZS4gSMOkdWZpZ2VzIExpdmUtVHJhY2tpbmcsIHNjaGxlY2h0ZXIgRW1wZmFuZyB1bmQgbmllZHJpZ2UgVGVtcGVyYXR1cmVuIHZlcmvDvHJ6ZW4gZGllIExhdWZ6ZWl0IGRldXRsaWNoLiBXZXJ0ZSBhdXMgZGVtIEVuZXJnaWVzcGFybW9kdXMgZMO8cmZlbiBuaWNodCBtaXQgZGVyIExhdWZ6ZWl0IGJlaSBrb250aW51aWVybGljaGVyIE9ydHVuZyBnbGVpY2hnZXNldHp0IHdlcmRlbi4KCiMjIFNvIGJld2VydGV0IFBmb3RlblRlY2huaWsKCldpciBnZXdpY2h0ZW4gUGFzc2Zvcm0gdW5kIEJlZmVzdGlndW5nIHN0w6Rya2VyIGFscyBBcHAtS29tZm9ydCBvZGVyIFp1c2F0emZ1bmt0aW9uZW4uIEVpbiBsZWljaHRlciBUcmFja2VyIGdld2lubnQgbmljaHQgYXV0b21hdGlzY2guIFNpY2hlcmhlaXQsIHRhdHPDpGNobGljaGUgRWlnbnVuZyBmw7xyIGRpZSBLYXR6ZSB1bmQgQWxsdGFnc3RhdWdsaWNoa2VpdCBzdGVoZW4gYW4gZXJzdGVyIFN0ZWxsZS4K", "base64").toString("utf8");
const checkOnly = process.argv.includes("--check");

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i >= 0) return process.argv[i + 1];
  const hit = process.argv.find((v) => v.startsWith(`${name}=`));
  return hit?.slice(name.length + 1);
}

function isRoot(root) {
  return fs.existsSync(path.join(root, "package.json")) &&
    fs.existsSync(path.join(root, "apps/pfotentechnik/src")) &&
    fs.existsSync(path.join(root, "packages/affiliate-core/src"));
}

function parents(start) {
  const out = [];
  let current = path.resolve(start);
  while (true) {
    out.push(current);
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return out;
}

function root() {
  const explicit = arg("--repo");
  if (explicit) {
    const value = path.resolve(explicit);
    if (!isRoot(value)) throw new Error(`Repository nicht gefunden: ${value}`);
    return value;
  }
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  for (const candidate of [...new Set([...parents(process.cwd()), ...parents(scriptDir)])]) {
    if (isRoot(candidate)) return candidate;
  }
  throw new Error("Repository nicht gefunden. Im Repository-Root starten oder --repo verwenden.");
}

const repo = root();
const files = {
  shell: "packages/affiliate-core/src/components/comparison/ComparisonShell.astro",
  summary: "packages/affiliate-core/src/components/comparison/ComparisonInsightSummary.astro",
  css: "packages/affiliate-core/src/components/comparison/comparison-ux-polish-3.2.css",
  model: "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts",
  gps: "apps/pfotentechnik/src/content/comparisons/beste-gps-tracker-fuer-katzen.md"
};
const plans = new Map();

function read(rel) {
  if (plans.has(rel)) return plans.get(rel).after;
  const abs = path.join(repo, rel);
  if (!fs.existsSync(abs)) throw new Error(`Datei fehlt: ${rel}`);
  return fs.readFileSync(abs, "utf8");
}

function queue(rel, after, reason) {
  const before = plans.has(rel) ? plans.get(rel).before : read(rel);
  if (before !== after) plans.set(rel, { rel, before, after, reason });
}

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: Anker ${count}-mal gefunden`);
  return source.replace(before, after);
}

let shell = read(files.shell);
shell = replaceOnce(
  shell,
`    <a href="#einsatzzwecke">Einsatzzwecke</a>
    <a href="#redaktionelle-zusammenfassung">Zusammenfassung</a>
    <a href="#direktvergleich">Vergleich</a>
    <a href="#methodik">Methodik</a>`,
`    <a href="#einsatzzwecke">Einsatzzwecke</a>
    <a href="#direktvergleich">Direktvergleich</a>
    {model.rows.length > 0 && (
      <a href="#redaktionelle-zusammenfassung">Zusammenfassung</a>
    )}
    <a href="#methodik">Methodik</a>`,
  "Navigation"
);
shell = replaceOnce(
  shell,
`    <section id="redaktionelle-zusammenfassung" class="comparison-premium-section" aria-label="Redaktionelle Zusammenfassung">
      <ComparisonInsightSummary products={model.products} rows={model.rows} />
    </section>

    <ComparisonExplorer
      products={model.products}
      rows={model.rows}
      filters={model.filters}
      initialVisibleProducts={model.initialVisibleProducts}
    />

    <ComparisonProsCons products={model.products} />`,
`    <ComparisonExplorer
      products={model.products}
      rows={model.rows}
      filters={model.filters}
      initialVisibleProducts={model.initialVisibleProducts}
    />

    {model.rows.length > 0 && (
      <section
        id="redaktionelle-zusammenfassung"
        class="comparison-premium-section"
        aria-label="Redaktionelle Zusammenfassung"
      >
        <ComparisonInsightSummary
          products={model.products}
          rows={model.rows}
        />
      </section>
    )}

    <ComparisonProsCons products={model.products} />`,
  "Reihenfolge"
);
queue(files.shell, shell, "Zusammenfassung unter Direktvergleich verschieben");

let model = read(files.model);
model = replaceOnce(
  model,
`    facts: [
      { label: "Modelle", value: String(views.length) },
      { label: "Kriterien", value: String(data.criteria.length) },
      { label: "Einordnung", value: "Unabhängig" }
    ],`,
`    facts: [
      { label: "Modelle", value: String(views.length) },
      ...(rows.length > 0
        ? [{ label: "Kriterien", value: String(rows.length) }]
        : [{
            label: "Datenstand",
            value: new Intl.DateTimeFormat("de-DE", {
              month: "2-digit",
              year: "numeric",
              timeZone: "UTC"
            }).format(
              new Date(\`\${data.updatedAt ?? data.publishedAt}T00:00:00Z\`)
            )
          }]),
      { label: "Einordnung", value: "Unabhängig" }
    ],`,
  "Hero-Fakten"
);
queue(files.model, model, "0 Kriterien durch Datenstand ersetzen");

const marker = "/* comparison-ux-criteria-8.3.0 */";
let css = read(files.css);
if (!css.includes(marker)) {
  css += `
${marker}
.comparison-premium-nav a {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: .55rem;
  border: 1px solid color-mix(in srgb, var(--comparison-accent) 22%, var(--comparison-line));
  color: var(--comparison-text);
  background: var(--comparison-surface-raised);
  box-shadow: 0 2px 7px rgba(20, 32, 26, .05);
  cursor: pointer;
  transition: border-color .18s ease, background-color .18s ease, box-shadow .18s ease, transform .18s ease;
}
.comparison-premium-nav a::after {
  display: grid;
  flex: 0 0 auto;
  width: 1.45rem;
  height: 1.45rem;
  place-items: center;
  border-radius: 999px;
  color: var(--comparison-accent);
  background: color-mix(in srgb, var(--comparison-accent) 12%, transparent);
  font-size: .78rem;
  font-weight: 900;
  line-height: 1;
  content: "↓";
}
.comparison-premium-nav a:hover {
  border-color: color-mix(in srgb, var(--comparison-accent) 58%, var(--comparison-line));
  background: color-mix(in srgb, var(--comparison-accent) 7%, var(--comparison-surface));
  box-shadow: 0 6px 18px rgba(20, 32, 26, .09);
  transform: translateY(-1px);
}
.comparison-premium-nav a:active { transform: translateY(0); }
.comparison-insight-summary__grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
}
@media (max-width: 760px) {
  .comparison-premium-nav a {
    justify-content: space-between;
    text-align: left;
  }
}
@media (prefers-reduced-motion: reduce) {
  .comparison-premium-nav a { transition: none; }
}
`;
}
queue(files.css, css, "Anker-Chips sichtbar klickbar gestalten");
queue(files.summary, SUMMARY.endsWith("\n") ? SUMMARY : SUMMARY + "\n", "Null-Karten ausblenden");
queue(files.gps, GPS.endsWith("\n") ? GPS : GPS + "\n", "GPS-Katzenvergleich mit acht Kriterien vervollständigen");

const finalShell = read(files.shell);
if (finalShell.indexOf("<ComparisonExplorer") > finalShell.indexOf('id="redaktionelle-zusammenfassung"')) {
  throw new Error("Zusammenfassung steht weiterhin vor dem Direktvergleich.");
}
if (read(files.model).includes('String(data.criteria.length)')) {
  throw new Error("Hero zeigt weiterhin rohe Kriterienzahl.");
}
if ((read(files.gps).match(/^  - key:/gm) ?? []).length !== 8) {
  throw new Error("GPS-Vergleich enthält nicht acht Kriterien.");
}

console.log(`\\n[${PATCH_ID}] Repository: ${repo}`);
console.log(`[${PATCH_ID}] Modus: ${checkOnly ? "nur prüfen" : "anwenden"}\\n`);
for (const plan of plans.values()) {
  console.log(`[AENDERN] ${plan.rel}`);
  console.log(`          ${plan.reason}`);
}
if (checkOnly) {
  console.log("\\nPrüfung erfolgreich. Es wurde nichts verändert.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(repo, ".patch-backups", `${PATCH_ID}-${stamp}`);
try {
  for (const plan of plans.values()) {
    const target = path.join(backup, plan.rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, plan.before, "utf8");
  }
  for (const plan of plans.values()) {
    const target = path.join(repo, plan.rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, plan.after, "utf8");
  }
  console.log(`\\nBackup: ${backup}`);
  console.log("Patch erfolgreich angewendet.");
  console.log("Jetzt: npm run build:pfotentechnik");
} catch (error) {
  for (const plan of [...plans.values()].reverse()) {
    fs.writeFileSync(path.join(repo, plan.rel), plan.before, "utf8");
  }
  throw error;
}
