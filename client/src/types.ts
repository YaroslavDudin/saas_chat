export type StepType = 'message' | 'question' | 'button_choice' | 'form';

export interface ScenarioNode {
    id: number;
    step_type: StepType;
    content: string;
    settings?: {
      buttons?: string[];
      data_key?: string;
      placeholder?: string;
    };
}

export interface BotConfig {
    name: string;
    theme_color: string;
    first_node: ScenarioNode | null;
}

export interface Message {
    id: string;
    text: string;
    isBot: boolean;
    timestamp: Date;
}
