export type Bot = {
  id: number;
  name: string;
  is_active: boolean;
  widget_id: string;
  theme_color: string;
  leads_count: number;
}

export type ScenarioNode = {
  id?: number;
  step_type: string;
  content: string;
}

export type CreateBotDTO = {
  name: string;
}
