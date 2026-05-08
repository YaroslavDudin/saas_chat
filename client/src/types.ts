export type StepType = 'message' | 'phone_collection' | 'button_choice';

export interface ScenarioNode {
    id: number;
    step_type: StepType;
    content: string;
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
