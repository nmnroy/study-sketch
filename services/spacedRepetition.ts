import { Flashcard } from '../types';

export interface CardRecord {
  question: string;
  easiness: number;      // starts at 2.5
  interval: number;      // days until next review, starts at 1
  repetitions: number;   // how many times reviewed
  nextReview: string;    // ISO date string
  lastResult: 'easy' | 'medium' | 'hard' | null;
}

const STORAGE_PREFIX = 'studysketch_card_';

export const saveCardRecord = (cardId: string, record: CardRecord): void => {
  localStorage.setItem(`${STORAGE_PREFIX}${cardId}`, JSON.stringify(record));
};

export const getCardRecord = (cardId: string): CardRecord | null => {
  const item = localStorage.getItem(`${STORAGE_PREFIX}${cardId}`);
  if (!item) return null;
  try {
    return JSON.parse(item) as CardRecord;
  } catch (e) {
    return null;
  }
};

export const getAllRecords = (): Record<string, CardRecord> => {
  const records: Record<string, CardRecord> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const cardId = key.substring(STORAGE_PREFIX.length);
      const record = getCardRecord(cardId);
      if (record) {
        records[cardId] = record;
      }
    }
  }
  return records;
};

export const updateCardAfterReview = (cardId: string, result: 'easy' | 'medium' | 'hard', question?: string): CardRecord => {
  let record = getCardRecord(cardId);

  // Initialize if no previous record exists
  if (!record) {
    record = {
      question: question || '',
      easiness: 2.5,
      interval: 1,
      repetitions: 0,
      nextReview: new Date().toISOString(),
      lastResult: null,
    };
  }

  // Handle first review case differently than subsequent reviews to avoid math explosion
  if (record.repetitions === 0) {
      if (result === 'easy') {
          record.interval = 4;
      } else if (result === 'medium') {
          record.interval = 1;
      } else {
          record.interval = 1;
      }
  } else {
      // Apply custom SM-2 algorithm specified
      if (result === 'hard') {
        record.interval = 1;
        record.easiness -= 0.2;
      } else if (result === 'medium') {
        record.interval = Math.round(record.interval * record.easiness);
      } else if (result === 'easy') {
        record.interval = Math.round(record.interval * record.easiness);
        record.easiness += 0.1;
      }
  }

  // Clamp easiness between 1.3 and 2.5
  record.easiness = Math.max(1.3, Math.min(2.5, record.easiness));
  
  // Ensure interval is at least 1
  record.interval = Math.max(1, record.interval);

  // Record repetitions and set next review date
  record.repetitions += 1;
  record.lastResult = result;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // reset to midnight for consistent day comparison
  const nextDate = new Date(today.getTime());
  nextDate.setDate(today.getDate() + record.interval);
  
  record.nextReview = nextDate.toISOString();

  saveCardRecord(cardId, record);
  return record;
};

export const getDueCards = (allCards: Flashcard[]): Flashcard[] => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // end of today
  
  return allCards.filter(card => {
    const record = getCardRecord(card.id);
    if (!record) return true; // No record means it's due for first review
    
    const reviewDate = new Date(record.nextReview);
    return reviewDate <= today;
  });
};
