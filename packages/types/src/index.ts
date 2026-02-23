export type PanelStatus = "queued" | "generating" | "complete" | "failed";

export interface ComicPanel {
  id: string;
  prompt: string;
  imageUrl?: string;
  status: PanelStatus;
  createdAt: string;
}

export interface StorySession {
  sessionId: string;
  title: string;
  sourceText: string;
}
