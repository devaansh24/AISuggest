// Add these type definitions to match the schema
export interface Session {
  id: string;
  title: string;
  created_at: string;
}

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
  user_id: string;
  user_name: string;
  cursor_x: number;
  cursor_y: number;
  color: string;
  last_seen: string;
}

export interface Message {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  message: string;
  color: string;
  created_at: string;
}
