export type User = {
  id: number;
  username: string;
  email: string;
  tier: 'free' | 'premium';
  messages_limit: number;
  messages_used: number;
}

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
  settings?: any;
}

export type CreateBotDTO = {
  name: string;
}
