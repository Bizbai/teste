export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ClothingItem {
  id: string;
  data: string; // Base64
}

export interface GenerationState {
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  error?: string;
}
