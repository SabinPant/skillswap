// types/enums.ts
// String-literal union types matching the backend's PHP enum wire format.
// Every backend enum case is listed explicitly so TypeScript can flag missing
// cases in switch statements and conditional checks.

export type UserRole = 'user' | 'admin';

export type SkillCategory =
  | 'programming'
  | 'design'
  | 'music'
  | 'languages'
  | 'fitness'
  | 'cooking'
  | 'photography'
  | 'marketing'
  | 'business'
  | 'other';

export type ProficiencyLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export type SkillRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type NotificationType =
  | 'request_received'
  | 'request_accepted'
  | 'request_rejected'
  | 'request_cancelled'
  | 'request_completed'  
  | 'request_expired'
  | 'session_reminder'
  | 'review_received'
  | 'message_received';

export type MessageType = 'text' | 'image' | 'file';