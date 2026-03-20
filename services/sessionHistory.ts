export interface StudySession {
  id: string;                    // uuid, generate with crypto.randomUUID()
  fileName: string;
  fileType: string;
  createdAt: string;             // ISO date string
  extractedText: string;
  diagramCode: string;
  summary: {
    oneliner: string;
    paragraph: string;
    bullets: string[];
  };
  flashcards: Array<{ question: string; answer: string }>;
}

const STORAGE_KEY = 'studysketch_sessions';

export const saveSession = (session: StudySession): void => {
  try {
    const existingSessionsString = localStorage.getItem(STORAGE_KEY);
    let sessions: StudySession[] = existingSessionsString ? JSON.parse(existingSessionsString) : [];
    
    // Add new session to the front
    sessions.unshift(session);
    
    // Keep only the latest 10 sessions
    sessions = sessions.slice(0, 10);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save session to localStorage:', error);
  }
};

export const getAllSessions = (): StudySession[] => {
  try {
    const sessionsString = localStorage.getItem(STORAGE_KEY);
    return sessionsString ? JSON.parse(sessionsString) : [];
  } catch (error) {
    console.error('Failed to retrieve sessions from localStorage:', error);
    return [];
  }
};

export const getSession = (id: string): StudySession | null => {
  const sessions = getAllSessions();
  return sessions.find(s => s.id === id) || null;
};

export const deleteSession = (id: string): void => {
  try {
    const sessions = getAllSessions();
    const updatedSessions = sessions.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
  } catch (error) {
    console.error('Failed to delete session from localStorage:', error);
  }
};
