export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface SCORMPackage {
  id: string;
  title: string;
  description: string;
  userId: string;
  content: ContentBlock[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentBlock {
  id: string;
  type: ContentType;
  title: string;
  data: any;
  order: number;
}

export type ContentType = 
  | 'welcome'
  | 'accordion'
  | 'checklist'
  | 'text-image'
  | 'document'
  | 'video'
  | 'flashcards'
  | 'quiz'
  | 'hotspot'
  | 'course-completed';

export interface WelcomeData {
  title: string;
  description: string;
  duration: number;
}

export interface AccordionData {
  title: string;
  description: string;
  items: {
    id: string;
    title: string;
    description: string;
    isExpanded: boolean;
  }[];
  itemColors?: Record<string, string>;
}

export interface ChecklistData {
  title: string;
  items: {
    id: string;
    text: string;
    checked: boolean;
    parentId?: string;
    children?: {
      id: string;
      text: string;
      checked: boolean;
    }[];
  }[];
}

export interface EmbedData {
  title: string;
  url: string;
  description?: string;
}

export interface TextImageData {
  layout: 'left' | 'right' | 'top' | 'behind' | 'none';
  image: string;
  content: string;
  title: string;
  altText: string;
}

export interface DocumentData {
  title: string;
  documentUrl: string;
  enforceCompletion: boolean;
  description: string;
  fileName?: string;
  fileType?: string;
  docxContent?: string;
}

export interface FlashcardData {
  title: string;
  description: string;
  cards: {
    id: string;
    frontTitle: string;
    frontDescription: string;
    back: string;
    image?: string; // Base64 data URL for card image
  }[];
}

export interface HotspotImageData {
  title: string;
  description: string;
  imageUrl: string;
  altText: string;
  hotspots: {
    id: string;
    x: number;
    y: number;
    title: string;
    description: string;
    color?: string;
  }[];
}

export interface QuizData {
  startTitle?: string;
  startContent?: string;
  finishTitle?: string;
  finishMessage?: string;
  questions: {
    id: string;
    type: 'mcq' | 'multiple' | 'true-false' | 'fill-blank' | 'match' | 'short-answer' | 'sequence';
    question: string;
    options?: string[];
    correctAnswer: any;
    explanation?: string;
    caseSensitive?: boolean;
    sentenceParts?: {
      type: 'text' | 'blank';
      text?: string;
      options?: string[];
      selectedAnswer?: string;
      isOpen?: boolean;
    }[];
    matchPairs?: {
      item: string;
      option: string;
    }[];
    sequenceItems?: {
      text: string;
    }[];
  }[];
}

export interface HotspotData {
  image: string;
  hotspots: {
    id: string;
    x: number;
    y: number;
    text: string;
  }[];
}

export interface VideoData {
  title: string;
  videoUrl: string;
  enforceCompletion: boolean;
  description: string;
}

export interface CourseCompletedData {
  title: string;
  subtitle: string;
  selectedEmoji: 'sad' | 'neutral' | 'happy';
  ctaText: string;
  backgroundImage?: string;
  layoutImage?: string;
  layout: 'image-behind' | 'image-left' | 'image-right' | 'no-image';
  confetti: 'none' | 'subtle' | 'celebration';
}
