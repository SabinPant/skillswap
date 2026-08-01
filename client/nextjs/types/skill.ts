// types/skill.ts
// Skill resource types verified against backend response shapes.
//
// Three distinct resources:
// - Skill: a row from the global taxonomy (Admin-managed)
// - UserSkill: a user's relationship to a skill (teach/learn + proficiency)
// - SearchResult: one row from the teacher search query (teacher-skill pair)

import type { SkillCategory, ProficiencyLevel } from './enums';
import type { PublicUser } from './user';

// ── Global skill taxonomy ──────────────────────────────────────────────

export interface Skill {
  id: string;
  name: string;
  slug: string;
  category: SkillCategory;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ── User's relationship to a skill ─────────────────────────────────────

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level: ProficiencyLevel;
  can_teach: boolean;
  wants_to_learn: boolean;
  created_at: string;
  updated_at: string;
  skill: Skill; // eagerly loaded by findByUser()
}

// ── Search result (one row per teacher-skill pair) ─────────────────────

export interface SearchResult extends PublicUser {
  latitude: number | null;
  longitude: number | null;
  proficiency_level: ProficiencyLevel;
  can_teach: boolean;
  wants_to_learn: boolean;
  skill_name: string;
  skill_id: string;
}

// ── Request payloads ───────────────────────────────────────────────────

export interface UserSkillRequest {
  skill_id: string;
  proficiency_level: ProficiencyLevel;
  can_teach: boolean;
  wants_to_learn: boolean;
}