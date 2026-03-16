# EduQuest - Educational Platform PRD

## Original Problem Statement
A web-based educational platform for school students (classes 1–10) that organises content by class, subject, and chapter. The platform provides an immersive chapter reading experience combining rendered textbook content, topic-linked GIF/image explainers that open as closeable overlays, and an admin panel for managing all media assets including videos, GIFs, images, and PDFs. GIF explainers are auto-generated at build time using an AI agent.

## User Personas
1. **Students (Age 6-16)**: Access class-specific content, read chapters, view visual explainers
2. **Administrators/Teachers**: Manage media assets (videos, GIFs, images, PDFs) via admin panel

## Core Requirements
- Login/Registration with JWT authentication
- Dashboard with class cards (1-10)
- Subject selector (Science, Maths)
- Topic selector with chapters
- Chapter reader with full-page layout
- GIF/Image explainer overlays triggered by section headings
- Admin panel with 4 media management sections
- AI-generated GIF explainers using Gemini Nano Banana

## What's Been Implemented (March 16, 2026)

### Authentication
- JWT-based auth with email/password
- User roles: student, admin
- Protected routes
- Default admin: admin@eduquest.com / admin123

### Student-Facing Pages
- `/login` - Clean login/register page with school-friendly design
- `/dashboard` - Grid of 10 colorful class cards
- `/class/:classId` - Subject selector (Science, Maths)
- `/class/:classId/subject/:subjectId` - Topic selector with chapters
- `/class/:classId/subject/:subjectId/topic/:topicId/chapter/:chapterId` - Chapter reader

### Chapter 14 Biology - The Respiratory System (Fully Implemented)
- All 11 sections from the PDF parsed and rendered
- Chemical equations with proper formatting
- Tables rendered as styled HTML
- Callout boxes for key information
- Progress check questions
- GIF play badges on each section heading
- Modal overlays with AI-generated explainers

### AI-Generated GIF Explainers (8 topics)
Using Gemini Nano Banana:
1. Need for Respiration - Glucose breakdown to ATP
2. Aerobic vs Anaerobic Respiration
3. Parts of Respiration - 4 major parts diagram
4. Respiratory Organs - Air path visualization
5. Breathing Cycle - Inhalation/Exhalation
6. Lung Capacities - Volume measurements
7. Inspired vs Expired Air - Composition comparison
8. Hypoxia - Oxygen deficiency visualization

### Admin Panel
- `/admin/videos` - Video management with URL or local upload
- `/admin/gifs` - GIF management (auto-populated with AI-generated)
- `/admin/images` - Image management
- `/admin/pdfs` - PDF management

### Technical Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI, React Router
- **Backend**: FastAPI, Motor (async MongoDB), JWT auth
- **Database**: MongoDB
- **AI**: Gemini Nano Banana for image generation
- **Storage**: Local file storage with MongoDB metadata

## Prioritized Backlog

### P0 (Critical) - Done
- [x] Login/Auth flow
- [x] Dashboard with class cards
- [x] Subject/Topic/Chapter navigation
- [x] Chapter 14 full content
- [x] GIF explainer modal overlay
- [x] Admin panel CRUD operations
- [x] AI GIF generation script

### P1 (High Priority)
- [ ] PDF upload and automatic parsing
- [ ] More chapters with full content
- [ ] Video playback in chapter reader
- [ ] Mobile responsive optimization

### P2 (Medium Priority)
- [ ] Student progress tracking
- [ ] Search functionality
- [ ] More subjects and classes
- [ ] Image extraction from PDF diagrams

### P3 (Nice to Have)
- [ ] Dark mode
- [ ] Notifications
- [ ] Assignments system
- [ ] Quiz functionality

## Next Tasks
1. Add more chapter content for other Biology chapters
2. Implement PDF parsing and auto-extraction
3. Add video player for chapter-linked videos
4. Mobile responsive improvements
5. Consider adding student progress tracking
