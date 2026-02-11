
export interface ChecklistTemplate {
  id: string;
  name: string;
  location: string;
  active: boolean;
}

export interface ChecklistItem {
  id: string;
  template_id: string;
  area: string;
  description: string;
  item_order: number;
}

export interface Inspection {
  id: string;
  template_id: string;
  user_id: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
  checklist_template?: ChecklistTemplate;
}

export interface InspectionResult {
    id: string;
    inspection_id: string;
    item_id: string;
    status: 'ok' | 'issue';
    observation?: string;
    generated_order_id?: string;
}
