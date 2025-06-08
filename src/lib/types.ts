export interface Idea {
  id: string;
  session_id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  created_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  user_name: string;
  cursor_x: number;
  cursor_y: number;
  color: string;
  last_seen: string;
}
