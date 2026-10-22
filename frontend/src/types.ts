// Mirrors the Flask JSON responses (backend/app/__init__.py, analysis.py).
export type Decision = "send" | "do_not_send" | "inconclusive";

export interface Inputs {
  cost_per_email: number;
  value_per_conversion: number | null;
  threshold: number;
}

export interface NetReturnResult {
  treated: string;
  reference: string;
  label: string;
  basis: "observed_spend" | "value_per_conversion";
  ci_method: string;
  incremental_per_1000: number;
  send_cost_per_1000: number;
  net_per_1000: number;
  net_ci_low: number;
  net_ci_high: number;
  breakeven_cost_per_email: number | null;
  breakeven_cost_per_email_ci_low: number | null;
  decision: Decision;
}

export interface Recommendation {
  action: Decision;
  campaign: string | null;
  message: string;
}

export interface NetReturnResponse {
  inputs: Inputs;
  results: NetReturnResult[];
  recommendation: Recommendation;
}

export interface Campaign {
  id: string;
  label: string;
  n: number;
  conversion_rate: number;
  mean_spend: number;
  mean_spend_if_buyer: number;
}

export interface CampaignsResponse {
  source: string;
  n_rows: number;
  window_days: number;
  campaigns: Campaign[];
}

export interface PeekRow {
  looks: number;
  naive: number;
  bonferroni: number;
  pocock: number;
  obrien_fleming: number;
}

export interface PeekingResponse {
  outcome: string;
  reps: number;
  n_per_group: number;
  mc_se: number;
  rows: PeekRow[];
  trails: number[][];
  trail_K: number;
  boundaries: { naive: number; obrien_fleming: number[] };
  note: string;
}

export interface Scenario {
  id: number;
  name: string;
  cost_per_email: number;
  value_per_conversion: number | null;
  threshold: number;
  created_at: string;
}
