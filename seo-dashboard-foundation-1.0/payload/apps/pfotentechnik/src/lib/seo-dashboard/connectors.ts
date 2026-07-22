import type { ConnectorStatus, SeoKpi, SeoPageRow } from "./types";
export interface DashboardConnectorResult { status:ConnectorStatus; kpis?:SeoKpi[]; pages?:SeoPageRow[] }
export interface DashboardConnector { id:string; collect():Promise<DashboardConnectorResult> }
export function pendingConnector(id:ConnectorStatus["id"], label:string, message:string):DashboardConnector {
  return { id, async collect(){ return { status:{id,label,status:"pending",message} }; } };
}
