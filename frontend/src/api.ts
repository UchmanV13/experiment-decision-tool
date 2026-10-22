import axios from "axios";
import type {
  CampaignsResponse, Inputs, NetReturnResponse, PeekingResponse, Scenario,
} from "./types";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
  timeout: 15000,
});

export function errorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) return e.response?.data?.error ?? e.message;
  return e instanceof Error ? e.message : "Unknown error";
}

export const getCampaigns = () => client.get<CampaignsResponse>("/api/campaigns").then(r => r.data);
export const getPeeking = () => client.get<PeekingResponse>("/api/peeking").then(r => r.data);
export const postNetReturn = (i: Inputs) =>
  client.post<NetReturnResponse>("/api/net-return", i).then(r => r.data);
export const getScenarios = () =>
  client.get<{ scenarios: Scenario[] }>("/api/scenarios").then(r => r.data.scenarios);
export const postScenario = (name: string, i: Inputs) =>
  client.post<Scenario>("/api/scenarios", { name, ...i }).then(r => r.data);
