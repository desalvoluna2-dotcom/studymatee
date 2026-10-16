import { z } from "zod";

export const emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, "Name is required").max(100),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).default("STUDENT"),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const courseSchema = z.object({
  code: z.string().max(20).optional().or(z.literal("")),
  title: z.string().min(1, "Course title is required").max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(1, "Category is required"),
});

export const subjectSchema = z.object({
  courseId: z.string().min(1),
  code: z.string().max(20).optional().or(z.literal("")),
  title: z.string().min(1, "Subject title is required").max(200),
  description: z.string().max(2000).optional(),
});

export const topicSchema = z.object({
  subjectId: z.string().min(1),
  title: z.string().min(1, "Topic title is required").max(200),
  description: z.string().max(2000).optional(),
  order: z.number().int().nonnegative().default(0),
});

export const reviewerSchema = z.object({
  courseId: z.string().min(1),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  materialId: z.string().optional(),
  title: z.string().min(1, "Reviewer title is required").max(200),
  format: z.enum(["CONCISE", "STANDARD", "DETAILED"]).default("STANDARD"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  language: z.string().min(1).default("en"),
});

export const quizSchema = z.object({
  courseId: z.string().min(1),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  title: z.string().min(1, "Quiz title is required").max(200),
  description: z.string().max(2000).optional(),
  questionCount: z.number().int().min(1).max(50).default(10),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  timeLimitMinutes: z.number().int().nonnegative().optional(),
  randomizeOrder: z.boolean().default(true),
});

export const questionSchema = z.object({
  quizId: z.string().min(1),
  type: z.enum([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "IDENTIFICATION",
    "FILL_IN_BLANK",
    "SHORT_ANSWER",
  ]),
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().optional(),
  points: z.number().int().nonnegative().default(1),
  order: z.number().int().nonnegative().default(0),
});

export const quizAttemptSchema = z.object({
  quizId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answerText: z.string(),
      })
    )
    .min(1, "At least one answer is required"),
});

export const flashcardDeckSchema = z.object({
  courseId: z.string().min(1),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  title: z.string().min(1, "Deck title is required").max(200),
  description: z.string().max(2000).optional(),
});

export const flashcardSchema = z.object({
  deckId: z.string().min(1),
  front: z.string().min(1, "Front is required"),
  back: z.string().min(1, "Back is required"),
});

export const studyTaskSchema = z.object({
  courseId: z.string().optional(),
  subjectId: z.string().optional(),
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional().or(z.literal("")),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).default("PENDING"),
  estimatedMinutes: z.number().int().nonnegative().optional(),
});

export const tutorMessageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, "Message is required").max(5000),
  language: z.string().min(1).default("en"),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
});

export const researchNoteSchema = z.object({
  courseId: z.string().optional(),
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  source: z.string().max(500).optional(),
  isVerified: z.boolean().default(false),
});

export const userPreferenceSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  language: z.string().min(1).max(10),
  notificationsEnabled: z.boolean(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type TopicInput = z.infer<typeof topicSchema>;
export type ReviewerInput = z.infer<typeof reviewerSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type QuizAttemptInput = z.infer<typeof quizAttemptSchema>;
export type FlashcardDeckInput = z.infer<typeof flashcardDeckSchema>;
export type FlashcardInput = z.infer<typeof flashcardSchema>;
export type StudyTaskInput = z.infer<typeof studyTaskSchema>;
export type TutorMessageInput = z.infer<typeof tutorMessageSchema>;
export type ResearchNoteInput = z.infer<typeof researchNoteSchema>;
export type UserPreferenceInput = z.infer<typeof userPreferenceSchema>;
