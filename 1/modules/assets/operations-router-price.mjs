import { checkAllProductPrices, checkProductPrice, priceAudit } from "../price-intelligence/service.mjs";
const errorStatus=(error)=>/nicht gefunden|fehlt/i.test(error?.message||"")?404:/nicht erlaubt|HTTPS|öffentlich|groesser|größer|unbekannt/i.test(error?.message||"")?400:422;
export async function handleOperationsRoute({request,response,requestUrl,origin,json,assertJsonRequest,readJsonBody}){
  try{
    if(request.method==="GET"&&requestUrl.pathname==="/api/admin/prices"){json(response,200,await priceAudit(),origin);return true}
    if(request.method==="POST"&&requestUrl.pathname==="/api/admin/prices/check"){assertJsonRequest(request);const body=await readJsonBody(request,32_768);json(response,200,await checkProductPrice(String(body.slug||"")),origin);return true}
    if(request.method==="POST"&&requestUrl.pathname==="/api/admin/prices/check-all"){assertJsonRequest(request);const body=await readJsonBody(request,32_768);json(response,200,await checkAllProductPrices({limit:body.limit}),origin);return true}
    return false;
  }catch(error){json(response,errorStatus(error),{error:{code:"PRICE_ACTION_FAILED",message:error instanceof Error?error.message:String(error)}},origin);return true}
}
