export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  preferences: Record<string, unknown>
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  frequency: 'daily' | 'weekly'
  color: string
  target_streak: number
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  date: string
  completed: boolean
}

export interface HabitWithStreak extends Habit {
  streak: number
  completedToday: boolean
}

export interface DailyScore {
  id: string
  user_id: string
  date: string
  productivity_score: number | null
  focus_minutes: number
  sleep_hours: number | null
  sleep_quality: number | null
  notes: string | null
}

export interface QuickNote {
  id: string
  user_id: string
  content: string
  updated_at: string
}

export interface DailyGoal {
  id: string
  user_id: string
  text: string
  date: string
  completed: boolean
  order_index: number
}

export interface AIInsight {
  id: string
  user_id: string
  date: string
  content: string
  created_at: string
}

export type ProjectCategory = 'personal' | 'business' | 'school' | 'golf' | 'gym' | 'content'
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  category: ProjectCategory
  status: ProjectStatus
  priority: Priority
  deadline: string | null
  progress: number
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  parent_task_id: string | null
  title: string
  status: TaskStatus
  priority: Priority
  deadline: string | null
  order_index: number
}

export interface GolfRound {
  id: string
  user_id: string
  date: string
  course: string
  score: number
  fairways_hit: number
  fairways_total: number
  gir: number
  putts: number
  scrambling: number | null
  penalties: number
  driving_distance: number | null
  notes: string | null
}

export interface Workout {
  id: string
  user_id: string
  date: string
  type: 'strength' | 'cardio' | 'flexibility' | 'other'
  duration: number
  notes: string | null
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  name: string
  sets: number
  reps: number
  weight: number | null
}

export interface Subject {
  id: string
  user_id: string
  name: string
  color: string
}

export interface Assignment {
  id: string
  user_id: string
  subject_id: string
  title: string
  due_date: string
  status: 'pending' | 'submitted' | 'graded'
  grade: number | null
  notes?: string | null
}

export interface Exam {
  id: string
  user_id: string
  subject_id: string
  title: string
  date: string
  status: 'upcoming' | 'completed'
  grade: number | null
  notes?: string | null
}

export interface Client {
  id: string
  user_id: string
  name: string
  company: string | null
  email: string | null
  status: 'lead' | 'active' | 'churned'
  value: number
  notes: string | null
  last_contact: string | null
  created_at: string
}

export interface PipelineDeal {
  id: string
  user_id: string
  client_id: string | null
  title: string
  stage: 'lead' | 'contacted' | 'proposal' | 'won' | 'lost'
  value: number
  notes: string | null
  updated_at: string
}
