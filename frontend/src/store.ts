import { create } from "zustand";
import * as api from "./api";
import type {
  CampaignsResponse, Inputs, NetReturnResponse, PeekingResponse, Scenario,
} from "./types";

interface State {
  inputs: Inputs;
  result: NetReturnResponse | null;
  campaigns: CampaignsResponse | null;
  peeking: PeekingResponse | null;
  scenarios: Scenario[];
  error: string | null;
  loading: boolean;
  setInputs: (patch: Partial<Inputs>) => void;
  loadScenario: (s: Scenario) => void;
  init: () => Promise<void>;
  recompute: () => Promise<void>;
  saveScenario: (name: string) => Promise<void>;
}

let seq = 0; // drop out-of-order responses while the user drags a slider
let timer: ReturnType<typeof setTimeout> | undefined;

export const useStore = create<State>((set, get) => ({
  inputs: { cost_per_email: 0.02, value_per_conversion: null, threshold: 0 },
  result: null, campaigns: null, peeking: null, scenarios: [], error: null, loading: false,

  setInputs: patch => {
    set(s => ({ inputs: { ...s.inputs, ...patch } }));
    clearTimeout(timer);
    timer = setTimeout(() => void get().recompute(), 150);
  },

  loadScenario: s => {
    get().setInputs({
      cost_per_email: s.cost_per_email,
      value_per_conversion: s.value_per_conversion,
      threshold: s.threshold,
    });
  },

  recompute: async () => {
    const id = ++seq;
    set({ loading: true });
    try {
      const result = await api.postNetReturn(get().inputs);
      if (id === seq) set({ result, error: null, loading: false });
    } catch (e) {
      if (id === seq) set({ error: api.errorMessage(e), loading: false });
    }
  },

  init: async () => {
    try {
      const [campaigns, peeking, scenarios] = await Promise.all([
        api.getCampaigns(), api.getPeeking(), api.getScenarios(),
      ]);
      set({ campaigns, peeking, scenarios });
      await get().recompute();
    } catch (e) {
      set({ error: api.errorMessage(e) });
    }
  },

  saveScenario: async name => {
    try {
      await api.postScenario(name, get().inputs);
      set({ scenarios: await api.getScenarios(), error: null });
    } catch (e) {
      set({ error: api.errorMessage(e) });
    }
  },
}));
