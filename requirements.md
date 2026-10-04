# Study Mind — Project Requirements

## 1. Project Overview

**Project Name:** Study Mind

**Project Type:** Full-Stack AI-Powered Personal Knowledge & Study Platform

**Frontend:** React.js

**Backend:** Node.js + Express.js

**AI Agent:** Python + FastAPI

**Database:** PostgreSQL

**Vector Search:** PostgreSQL + pgvector

**Authentication:** JWT-based authentication

**Primary Users:** Students, university students, researchers, and self-learners

---

# 2. Project Description

Study Mind is an AI-powered personal study and knowledge platform where users can upload their own study material such as PDFs, lecture notes, text files, and documents.

The system processes the uploaded material and creates a personal knowledge base for the user.

Users can then communicate with an AI Study Agent that answers questions using their uploaded material instead of giving only general AI answers.

For example:

A student uploads:

- Database Lecture 1.pdf
- Database Lecture 2.pdf
- Assignment Requirements.pdf
- Personal Notes.txt

The student can then ask:

> "Explain database normalization using my lectures."

Study Mind searches the student's uploaded material, finds the relevant information, and generates an easy-to-understand answer.

The system should also show which document or source was used to generate the answer.

---

# 3. Main Problem

Students normally keep their study material across different locations:

- PDFs
- lecture slides
- Word documents
- notes
- downloaded books
- assignment files
- screenshots
- different folders

Finding previously studied information becomes difficult when the amount of material increases.

Normal AI chatbots also do not automatically understand a student's personal lectures, notes, assignments, or teacher-provided material.

Study Mind solves this problem by creating one intelligent study workspace where students can store their knowledge and communicate with it.

---

# 4. Main Project Goals

Study Mind should allow a user to:

1. Create an account.
2. Login securely.
3. Upload study documents.
4. Organize documents into subjects/workspaces.
5. Process uploaded documents automatically.
6. Convert document content into searchable knowledge.
7. Ask questions about uploaded documents.
8. Receive AI-generated answers based on their documents.
9. View the sources used for an answer.
10. Generate document summaries.
11. Generate study notes.
12. Generate quizzes.
13. Generate flashcards.
14. Save important AI conversations.
15. Search previously uploaded knowledge.
16. Track basic study activity.

The application should feel like a **personal AI study companion**, not simply a "Chat with PDF" application.

---

# 5. Technology Stack

## 5.1 Frontend

Use:

- React.js
- Vite
- React Router
- Axios
- Context API or Zustand
- CSS Modules or structured CSS
- Lucide React for icons

Avoid installing large UI component libraries unless absolutely necessary.

Do NOT use:

- Material UI
- Ant Design
- randomly generated UI components
- unnecessary animation libraries

The interface should be custom-built according to the Study Mind design system.

---

## 5.2 Backend

Use:

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT
- bcrypt
- Multer
- Zod or Joi
- Axios

The Node.js backend is the main application API.

Responsibilities:

- Authentication
- User management
- Workspace management
- Document management
- Chat history
- Database operations
- File upload handling
- Authorization
- Calling the Python AI service
- Returning responses to React

---

## 5.3 AI Agent

Use:

- Python
- FastAPI
- Pydantic
- LangChain only where useful
- LLM API
- Embedding model
- PostgreSQL pgvector
- PDF/text extraction libraries

The Python service should contain ALL AI-related logic.

Responsibilities:

- Document extraction
- Text cleaning
- Text chunking
- Embedding generation
- Vector search
- RAG
- Question answering
- Source retrieval
- Summarization
- Quiz generation
- Flashcard generation
- Study-note generation

Do not place AI logic inside the React frontend.

Do not place large AI logic directly inside the Node.js backend.

---

# 6. High-Level Architecture

The application should follow this architecture:

```text
┌───────────────────────────────┐
│                               │
│          React.js             │
│          Frontend             │
│                               │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│                               │
│      Node.js + Express        │
│        Main Backend           │
│                               │
└───────────┬─────────┬─────────┘
            │         │
            │         │
            ▼         ▼
   ┌──────────────┐  ┌────────────────────┐
   │ PostgreSQL   │  │ Python + FastAPI   │
   │              │  │    AI Service      │
   └──────────────┘  └─────────┬──────────┘
                               │
                               ▼
                     ┌────────────────────┐
                     │ LLM + Embeddings   │
                     │ RAG + pgvector     │
                     └────────────────────┘
```

---

# 7. Application Flow

Basic document flow:

```text
User
 ↓
Upload Document
 ↓
React Frontend
 ↓
Node.js API
 ↓
Store document metadata
 ↓
Send document to Python Agent
 ↓
Extract text
 ↓
Clean text
 ↓
Split into chunks
 ↓
Generate embeddings
 ↓
Store vectors
 ↓
Document Ready
```

Question answering flow:

```text
User Question
 ↓
React
 ↓
Node.js
 ↓
Python Study Agent
 ↓
Generate question embedding
 ↓
Vector Search
 ↓
Retrieve relevant document chunks
 ↓
Send context + question to LLM
 ↓
Generate answer
 ↓
Attach sources
 ↓
Node.js
 ↓
React
 ↓
Display Answer + Sources
```

---

# 8. Design System

## 8.1 Main Colors

Study Mind must use the following primary color palette.

```css
--color-black: #000000;
--color-primary: #CB2957;
--color-gray: #DDDDDD;
--color-light: #EEEEEE;
```

### Usage

`#CB2957`

Use for:

- Primary buttons
- Active navigation items
- Important icons
- Selected elements
- Progress indicators
- Focus states
- Small highlights

`#000000`

Use for:

- Main headings
- Primary text
- Strong icons
- Navigation text

`#DDDDDD`

Use for:

- Borders
- Disabled controls
- Secondary surfaces
- Separators where necessary

`#EEEEEE`

Use for:

- Main application background
- Cards
- Input backgrounds
- Soft content sections

Do not introduce random blue, green, purple, orange, or other accent colors.

Status colors should preferably use opacity or icon/text differences instead of adding many unrelated colors.

---

# 9. UI Art Direction

The uploaded reference images should be used as **visual inspiration**, not copied directly.

Study Mind should have a friendly, soft, futuristic AI-companion appearance.

The visual style should include:

- Large rounded containers
- Rounded cards
- Clean surfaces
- Soft shadows
- Large readable headings
- Friendly typography
- Plenty of spacing
- Simple icons
- Minimal visual noise
- AI companion personality
- Large central content areas
- Simple navigation
- Modern mobile-inspired cards
- Smooth hover states
- Smooth page transitions

The application should feel friendly rather than corporate.

---

# 10. UI Restrictions

Do NOT create unnecessary decorative elements.

Avoid:

- Random dots
- Decorative floating circles
- Random horizontal lines
- Random vertical lines
- Decorative arrows
- Random geometric shapes
- Fake graphs used only for decoration
- excessive glassmorphism
- excessive gradients
- excessive shadows
- glowing borders
- constantly moving backgrounds
- excessive floating animations
- unnecessary animated particles

Every visible element should have a purpose.

---

# 11. Animation Requirements

Animations should be minimal.

The website should feel smooth but not animated excessively.

Recommended transitions:

```css
transition: 150ms ease;
```

or

```css
transition: 200ms ease;
```

Use transitions for:

- Button hover
- Card hover
- Input focus
- Sidebar opening
- Dropdown opening
- Modal opening
- Page content appearance
- Tab switching

Example:

```css
.button {
    transition:
        background-color 180ms ease,
        transform 180ms ease,
        box-shadow 180ms ease;
}

.button:hover {
    transform: translateY(-1px);
}
```

Do NOT use large bouncing, spinning, floating, or continuous animations.

---

# 12. Border Radius

The UI should use noticeably rounded elements similar to the reference style.

Recommended values:

```css
--radius-small: 8px;
--radius-medium: 12px;
--radius-large: 18px;
--radius-xl: 24px;
```

Cards:

```css
border-radius: 18px;
```

Large containers:

```css
border-radius: 24px;
```

Buttons:

```css
border-radius: 10px;
```

Inputs:

```css
border-radius: 12px;
```

---

# 13. Shadows

Use soft shadows.

Example:

```css
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
```

Avoid strong black shadows.

Cards should appear slightly elevated rather than floating heavily.

---

# 14. Typography

Use a clean modern sans-serif font.

Recommended:

- Inter
- Manrope
- DM Sans

Preferred:

**Inter**

Typography hierarchy:

```text
Hero Heading       48–64px
Page Heading       32–40px
Section Heading    24–28px
Card Heading       18–20px
Body               14–16px
Small Text         12–14px
```

Mobile sizes must automatically reduce.

---

# 15. Responsive Design

The website must support:

- Desktop
- Laptop
- Tablet
- Mobile

Suggested breakpoints:

```css
1200px
992px
768px
576px
```

Desktop may use a sidebar.

Mobile should convert the sidebar into a drawer or simplified navigation.

No page should require horizontal scrolling.

---

# 16. Main Pages

The application should contain the following pages.

```text
/
├── Landing
├── Login
├── Register
├── Dashboard
├── Knowledge
├── Workspace
├── Document
├── Study Agent
├── Study Tools
├── Quiz
├── Flashcards
├── History
├── Profile
├── Settings
└── 404
```

---

# 17. Landing Page

The landing page introduces Study Mind.

## Hero

Main heading example:

> Turn your study material into your personal AI mind.

Description:

> Upload your lectures, notes and documents. Ask questions, create summaries, generate quizzes and study smarter with an AI that understands your material.

Primary CTA:

> Start Studying

Secondary CTA:

> See How It Works

The hero should contain a large Study Mind AI companion illustration or product preview inspired by the friendly robot style of the reference images.

Do not overcrowd the hero.

---

# 18. Landing Page Sections

Recommended sections:

### Hero

Product introduction.

### How It Works

Three or four simple cards:

```text
Upload
   ↓
Understand
   ↓
Ask
   ↓
Learn
```

### Features

Show:

- AI Knowledge Chat
- Smart Summaries
- Source-Based Answers
- Flashcards
- Quiz Generation
- Organized Knowledge

### Product Preview

Show a mock application window demonstrating Study Mind.

### Final CTA

Example:

> Your notes already contain the answers. Study Mind helps you find them.

Button:

> Create Your Study Mind

---

# 19. Authentication

Users must be able to:

- Register
- Login
- Logout
- Stay logged in
- Reset password in future versions

Registration fields:

```text
Full Name
Email
Password
Confirm Password
```

Login:

```text
Email
Password
Remember Me
```

Passwords must NEVER be stored directly.

Use bcrypt hashing.

---

# 20. Dashboard

After login, users should see the main dashboard.

Example greeting:

> Good evening, Alex.

Subtext:

> What are we learning today?

Dashboard should contain:

### Continue Studying

Recently opened workspace.

### Recent Documents

Recently uploaded documents.

### Ask Study Mind

Large AI input.

Example:

> Ask anything from your study material...

### Study Statistics

Simple statistics:

```text
Documents       24
Subjects         5
Questions       83
Flashcards     126
```

### Recent Activity

Example:

```text
Asked about normalization
Generated Operating Systems quiz
Uploaded Lecture 05.pdf
Created Database workspace
```

Do not turn the dashboard into a complex analytics dashboard.

---

# 21. Workspace / Subject System

Users should organize knowledge into workspaces.

Example:

```text
My Knowledge

├── Database Systems
├── Operating Systems
├── Artificial Intelligence
├── Web Development
└── Final Year Project
```

A workspace contains:

```text
Workspace
├── Documents
├── Conversations
├── Summaries
├── Flashcards
└── Quizzes
```

Users can:

- Create workspace
- Rename workspace
- Delete workspace
- Change workspace icon
- View workspace
- Upload documents into workspace

---

# 22. Knowledge Library

The Knowledge page shows all uploaded material.

Users should be able to:

- Upload document
- View document
- Search documents
- Filter by workspace
- Sort by upload date
- Delete document
- Rename document
- Reprocess failed document

Document card example:

```text
Database Lecture 04

PDF • 18 pages

Database Systems

Ready

Uploaded 2 hours ago
```

---

# 23. Supported Documents

MVP should support:

```text
.pdf
.txt
.md
.docx
```

Maximum upload size should be configurable.

Recommended initial limit:

```text
20 MB
```

Backend must validate:

- MIME type
- extension
- size
- ownership

---

# 24. Document Processing States

Documents should have statuses:

```text
UPLOADING
PROCESSING
READY
FAILED
```

Example UI:

```text
Lecture-05.pdf

Processing your document...
```

When completed:

```text
Lecture-05.pdf

Ready to study
```

If processing fails:

```text
Lecture-05.pdf

Processing failed

[Try Again]
```

---

# 25. Study Agent

The Study Agent is the main feature.

Layout:

```text
┌─────────────────────────────────────────────┐
│ Study Mind                                 │
├───────────────┬─────────────────────────────┤
│               │                             │
│ Conversations │       Chat Area             │
│               │                             │
│               │                             │
│               │                             │
│               ├─────────────────────────────┤
│               │ Ask Study Mind...      Send │
└───────────────┴─────────────────────────────┘
```

Users can select:

```text
All Knowledge
```

or:

```text
Specific Workspace
```

or:

```text
Specific Documents
```

---

# 26. Chat Messages

User message:

```text
Explain normalization in simple words.
```

AI response:

```text
Database normalization is a method of organizing data
to reduce duplicate information...

Example:

Instead of storing student information repeatedly in
every course record, we separate students and courses
into related tables.
```

Under the response:

```text
Sources

Database Lecture 03.pdf — Page 8
Database Notes.pdf — Page 3
```

Users should be able to click a source.

---

# 27. Source-Based Answers

Source citations are an important Study Mind feature.

The AI should NOT pretend information exists in documents when it cannot find it.

If relevant information is unavailable:

> I couldn't find enough information about this topic in your selected study material.

The UI may then allow:

> Ask using general knowledge

This should be clearly separated from document-grounded answers.

---

# 28. RAG Requirements

The Python agent should implement Retrieval-Augmented Generation.

Pipeline:

```text
Document
 ↓
Extract Text
 ↓
Clean
 ↓
Chunk
 ↓
Embedding
 ↓
Vector Database
```

Question:

```text
Question
 ↓
Question Embedding
 ↓
Similarity Search
 ↓
Top Relevant Chunks
 ↓
Prompt Construction
 ↓
LLM
 ↓
Answer
```

Every retrieved chunk must maintain metadata:

```json
{
    "documentId": "...",
    "documentName": "...",
    "workspaceId": "...",
    "page": 4,
    "chunkIndex": 12
}
```

This metadata is used for source citations.

---

# 29. Study Modes

Study Mind should provide several focused modes.

## Explain

User asks the AI to explain a topic.

Example:

> Explain deadlocks like I am a beginner.

## Summarize

Generate a summary from selected material.

## Quiz Me

Generate questions based on documents.

## Flashcards

Generate study flashcards.

## Compare

Compare information between documents.

Example:

> Compare Lecture 3 with Lecture 4.

---

# 30. Summary Generator

Users can select a document and choose:

```text
Generate Summary
```

Summary types:

```text
Quick Summary
Detailed Summary
Key Points
Exam Revision
```

Generated summaries should be saved.

---

# 31. Quiz Generator

Users should be able to generate quizzes from selected study material.

Settings:

```text
Number of Questions

5
10
15
20
```

Question type:

```text
Multiple Choice
True / False
Short Answer
Mixed
```

Difficulty:

```text
Easy
Medium
Hard
```

Example:

```text
Question 1

What is database normalization?

A. Data encryption
B. Organizing data to reduce redundancy
C. Database backup
D. Database authentication
```

After answering:

```text
Correct!

Normalization helps organize database tables and
reduce duplicate information.
```

---

# 32. Flashcards

Users can generate flashcards from their documents.

Example:

Front:

```text
What is a Primary Key?
```

Back:

```text
A column or combination of columns that uniquely
identifies each row in a table.
```

Users should be able to:

- Flip card
- Next
- Previous
- Mark as known
- Mark for review
- Save deck

Use only a subtle card flip transition.

Do not use excessive 3D animation.

---

# 33. Study History

Store previous conversations.

Example:

```text
Today

Database Normalization
10:42 PM

Operating System Deadlocks
8:31 PM


Yesterday

SQL Joins
5:20 PM
```

Users can:

- Open conversation
- Rename conversation
- Delete conversation
- Search conversations

---

# 34. Global Search

Provide a search field that can search:

- Workspaces
- Documents
- Conversations
- Saved summaries

Example:

```text
Search Study Mind...
```

Search result:

```text
Normalization

Found in:

Database Lecture 03.pdf
Database Notes.pdf
Conversation: Exam Preparation
```

---

# 35. Profile

Profile should contain:

```text
Profile Image
Full Name
Email
Joined Date
```

Users can update:

- Name
- Profile image
- Password

---

# 36. Settings

Settings sections:

```text
Account
Appearance
AI Preferences
Data & Privacy
```

AI preferences may include:

```text
Answer Style

○ Short
● Balanced
○ Detailed
```

and:

```text
Explanation Level

○ Beginner
● Intermediate
○ Advanced
```

---

# 37. Navigation

Desktop navigation:

```text
Study Mind

Home
Knowledge
Study Agent
Study Tools
History

----------------

Settings
Profile
```

Avoid unnecessary navigation items.

On mobile, use a compact menu/drawer.

---

# 38. Common Components

Reusable components must NOT be placed directly inside pages.

Create a dedicated common component structure.

Examples:

```text
components/
├── common/
│   ├── Navbar/
│   │   ├── Navbar.jsx
│   │   └── Navbar.css
│   │
│   ├── Sidebar/
│   │   ├── Sidebar.jsx
│   │   └── Sidebar.css
│   │
│   ├── Button/
│   │   ├── Button.jsx
│   │   └── Button.css
│   │
│   ├── Input/
│   │   ├── Input.jsx
│   │   └── Input.css
│   │
│   ├── Modal/
│   │   ├── Modal.jsx
│   │   └── Modal.css
│   │
│   └── Loader/
│       ├── Loader.jsx
│       └── Loader.css
```

Do not create one huge:

```text
components.jsx
```

file.

---

# 39. Required Project Structure

The repository must be organized into three main applications.

```text
study-mind/
│
├── frontend/
│
├── backend/
│
├── agent/
│
├── docs/
│
├── .gitignore
├── README.md
├── requirements.md
└── docker-compose.yml
```

Frontend code must remain inside `frontend/`.

Node.js code must remain inside `backend/`.

Python AI code must remain inside `agent/`.

Do not mix responsibilities.

---

# 40. Frontend Folder Structure

```text
frontend/
│
├── public/
│   ├── favicon.ico
│   └── assets/
│
├── src/
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── illustrations/
│   │
│   ├── components/
│   │   │
│   │   ├── common/
│   │   │   ├── Navbar/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Navbar.css
│   │   │   │
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Sidebar.css
│   │   │   │
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   └── Button.css
│   │   │   │
│   │   │   ├── Input/
│   │   │   │   ├── Input.jsx
│   │   │   │   └── Input.css
│   │   │   │
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── Modal.css
│   │   │   │
│   │   │   ├── Loader/
│   │   │   │   ├── Loader.jsx
│   │   │   │   └── Loader.css
│   │   │   │
│   │   │   ├── EmptyState/
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   └── EmptyState.css
│   │   │   │
│   │   │   └── PageHeader/
│   │   │       ├── PageHeader.jsx
│   │   │       └── PageHeader.css
│   │   │
│   │   ├── dashboard/
│   │   │   ├── WelcomeCard.jsx
│   │   │   ├── RecentDocuments.jsx
│   │   │   ├── QuickAsk.jsx
│   │   │   └── StudyStats.jsx
│   │   │
│   │   ├── knowledge/
│   │   │   ├── DocumentCard.jsx
│   │   │   ├── DocumentGrid.jsx
│   │   │   ├── UploadDocument.jsx
│   │   │   └── WorkspaceCard.jsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── UserMessage.jsx
│   │   │   ├── AgentMessage.jsx
│   │   │   ├── SourceCard.jsx
│   │   │   └── ConversationList.jsx
│   │   │
│   │   ├── quiz/
│   │   │   ├── QuizCard.jsx
│   │   │   ├── QuizQuestion.jsx
│   │   │   └── QuizResult.jsx
│   │   │
│   │   └── flashcards/
│   │       ├── Flashcard.jsx
│   │       └── FlashcardDeck.jsx
│   │
│   ├── pages/
│   │   ├── Landing/
│   │   │   ├── Landing.jsx
│   │   │   └── Landing.css
│   │   │
│   │   ├── Login/
│   │   │   ├── Login.jsx
│   │   │   └── Login.css
│   │   │
│   │   ├── Register/
│   │   │   ├── Register.jsx
│   │   │   └── Register.css
│   │   │
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Dashboard.css
│   │   │
│   │   ├── Knowledge/
│   │   │   ├── Knowledge.jsx
│   │   │   └── Knowledge.css
│   │   │
│   │   ├── Workspace/
│   │   │   ├── Workspace.jsx
│   │   │   └── Workspace.css
│   │   │
│   │   ├── StudyAgent/
│   │   │   ├── StudyAgent.jsx
│   │   │   └── StudyAgent.css
│   │   │
│   │   ├── StudyTools/
│   │   │   ├── StudyTools.jsx
│   │   │   └── StudyTools.css
│   │   │
│   │   ├── Quiz/
│   │   │   ├── Quiz.jsx
│   │   │   └── Quiz.css
│   │   │
│   │   ├── Flashcards/
│   │   │   ├── Flashcards.jsx
│   │   │   └── Flashcards.css
│   │   │
│   │   ├── History/
│   │   │   ├── History.jsx
│   │   │   └── History.css
│   │   │
│   │   ├── Profile/
│   │   │   ├── Profile.jsx
│   │   │   └── Profile.css
│   │   │
│   │   ├── Settings/
│   │   │   ├── Settings.jsx
│   │   │   └── Settings.css
│   │   │
│   │   └── NotFound/
│   │       ├── NotFound.jsx
│   │       └── NotFound.css
│   │
│   ├── layouts/
│   │   ├── AppLayout.jsx
│   │   └── AuthLayout.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useDocuments.js
│   │   └── useChat.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── documentService.js
│   │   ├── workspaceService.js
│   │   └── chatService.js
│   │
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── utils/
│   │   ├── formatDate.js
│   │   ├── formatFileSize.js
│   │   └── constants.js
│   │
│   ├── styles/
│   │   ├── variables.css
│   │   ├── global.css
│   │   └── responsive.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env.example
├── package.json
└── vite.config.js
```

---

# 41. Backend Folder Structure

```text
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.js
│   │   ├── database.js
│   │   └── cors.js
│   │
│   ├── controllers/
│   │   ├── auth/
│   │   │   └── authController.js
│   │   ├── users/
│   │   │   └── userController.js
│   │   ├── workspaces/
│   │   │   └── workspaceController.js
│   │   ├── documents/
│   │   │   └── documentController.js
│   │   ├── chats/
│   │   │   └── chatController.js
│   │   ├── quizzes/
│   │   │   └── quizController.js
│   │   └── flashcards/
│   │       └── flashcardController.js
│   │
│   ├── routes/
│   │   ├── auth/
│   │   │   └── authRoutes.js
│   │   ├── users/
│   │   │   └── userRoutes.js
│   │   ├── workspaces/
│   │   │   └── workspaceRoutes.js
│   │   ├── documents/
│   │   │   └── documentRoutes.js
│   │   ├── chats/
│   │   │   └── chatRoutes.js
│   │   ├── quizzes/
│   │   │   └── quizRoutes.js
│   │   └── flashcards/
│   │       └── flashcardRoutes.js
│   │
│   ├── middleware/
│   │   ├── auth/
│   │   │   └── authMiddleware.js
│   │   ├── upload/
│   │   │   └── uploadMiddleware.js
│   │   ├── validation/
│   │   │   └── validationMiddleware.js
│   │   ├── rateLimit/
│   │   │   └── rateLimitMiddleware.js
│   │   └── error/
│   │       └── errorMiddleware.js
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   └── authService.js
│   │   ├── documents/
│   │   │   └── documentService.js
│   │   ├── workspaces/
│   │   │   └── workspaceService.js
│   │   ├── chats/
│   │   │   └── chatService.js
│   │   └── agent/
│   │       └── agentService.js
│   │
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── workspaceValidator.js
│   │   └── documentValidator.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   ├── response.js
│   │   ├── logger.js
│   │   └── file.js
│   │
│   ├── constants/
│   │   ├── roles.js
│   │   └── documentStatus.js
│   │
│   ├── app.js
│   └── server.js
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
│
├── uploads/
│
├── tests/
│   ├── auth/
│   ├── documents/
│   └── workspaces/
│
├── .env.example
└── package.json
```

---

# 42. Python Agent Folder Structure

All AI-related code must stay inside `agent/`.

```text
agent/
│
├── app/
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── documents.py
│   │   │   ├── chat.py
│   │   │   ├── summaries.py
│   │   │   ├── quizzes.py
│   │   │   └── flashcards.py
│   │   │
│   │   └── dependencies.py
│   │
│   ├── agents/
│   │   ├── study_agent.py
│   │   ├── quiz_agent.py
│   │   ├── summary_agent.py
│   │   └── flashcard_agent.py
│   │
│   ├── rag/
│   │   ├── chunker.py
│   │   ├── embeddings.py
│   │   ├── retriever.py
│   │   ├── vector_store.py
│   │   └── pipeline.py
│   │
│   ├── documents/
│   │   ├── extractor.py
│   │   ├── pdf_extractor.py
│   │   ├── docx_extractor.py
│   │   ├── text_extractor.py
│   │   └── cleaner.py
│   │
│   ├── llm/
│   │   ├── client.py
│   │   ├── prompts.py
│   │   └── response_parser.py
│   │
│   ├── schemas/
│   │   ├── chat.py
│   │   ├── document.py
│   │   ├── quiz.py
│   │   └── flashcard.py
│   │
│   ├── services/
│   │   ├── document_service.py
│   │   ├── chat_service.py
│   │   ├── summary_service.py
│   │   ├── quiz_service.py
│   │   └── flashcard_service.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── logging.py
│   │
│   ├── utils/
│   │   ├── text.py
│   │   ├── tokens.py
│   │   └── files.py
│   │
│   └── main.py
│
├── tests/
│   ├── test_rag.py
│   ├── test_documents.py
│   └── test_agent.py
│
├── .env.example
├── requirements.txt
└── Dockerfile
```

---

# 43. Database Models

Minimum database entities:

```text
User
Workspace
Document
Conversation
Message
Source
Summary
Quiz
QuizQuestion
FlashcardDeck
Flashcard
StudyActivity
```

---

# 44. User Model

Example fields:

```text
id
name
email
passwordHash
avatarUrl
createdAt
updatedAt
```

---

# 45. Workspace Model

```text
id
userId
name
description
createdAt
updatedAt
```

Relationship:

```text
User
  └── has many Workspaces
```

---

# 46. Document Model

```text
id
userId
workspaceId
originalName
storedName
mimeType
fileSize
filePath
status
pageCount
createdAt
updatedAt
```

---

# 47. Conversation Model

```text
id
userId
workspaceId
title
createdAt
updatedAt
```

---

# 48. Message Model

```text
id
conversationId
role
content
createdAt
```

Role:

```text
USER
ASSISTANT
```

---

# 49. Source Model

```text
id
messageId
documentId
pageNumber
chunkId
contentPreview
similarityScore
```

---

# 50. Quiz Model

```text
id
userId
workspaceId
title
difficulty
questionCount
createdAt
```

---

# 51. Quiz Question Model

```text
id
quizId
question
type
options
correctAnswer
explanation
```

---

# 52. Flashcard Model

```text
id
deckId
front
back
status
createdAt
```

Status:

```text
NEW
LEARNING
KNOWN
REVIEW
```

---

# 53. API Structure

All Node.js endpoints should begin with:

```text
/api/v1
```

---

# 54. Authentication API

```text
POST /api/v1/auth/register

POST /api/v1/auth/login

POST /api/v1/auth/logout

GET /api/v1/auth/me
```

---

# 55. Workspace API

```text
GET    /api/v1/workspaces

POST   /api/v1/workspaces

GET    /api/v1/workspaces/:id

PATCH  /api/v1/workspaces/:id

DELETE /api/v1/workspaces/:id
```

---

# 56. Document API

```text
GET    /api/v1/documents

POST   /api/v1/documents/upload

GET    /api/v1/documents/:id

PATCH  /api/v1/documents/:id

DELETE /api/v1/documents/:id

POST   /api/v1/documents/:id/reprocess
```

---

# 57. Chat API

```text
GET    /api/v1/conversations

POST   /api/v1/conversations

GET    /api/v1/conversations/:id

DELETE /api/v1/conversations/:id

POST   /api/v1/conversations/:id/messages
```

---

# 58. Study Tools API

```text
POST /api/v1/study/summarize

POST /api/v1/study/quiz

POST /api/v1/study/flashcards
```

---

# 59. Internal Agent API

The Python API should NOT normally be called directly by the frontend.

Node.js communicates with Python.

Example internal routes:

```text
GET  /health

POST /documents/process

POST /chat

POST /summaries/generate

POST /quizzes/generate

POST /flashcards/generate
```

---

# 60. Standard API Response

Success:

```json
{
    "success": true,
    "message": "Document uploaded successfully.",
    "data": {}
}
```

Error:

```json
{
    "success": false,
    "message": "Document could not be uploaded.",
    "error": {
        "code": "INVALID_FILE_TYPE"
    }
}
```

Use consistent responses throughout the application.

---

# 61. Loading States

Every async action needs a loading state.

Examples:

```text
Uploading document...
```

```text
Study Mind is reading your material...
```

```text
Finding the most relevant notes...
```

```text
Creating your quiz...
```

Use a simple loader.

Do not use complicated animated AI effects.

---

# 62. Empty States

Never display completely blank screens.

Example Knowledge empty state:

```text
Your knowledge space is empty.

Upload your first lecture, note or document and
Study Mind will turn it into searchable knowledge.

[Upload Document]
```

Example History:

```text
No conversations yet.

Ask Study Mind your first question.
```

---

# 63. Error States

Errors must be understandable.

Bad:

```text
Error 500.
```

Better:

```text
We couldn't process this document.

Please check the file and try again.
```

Provide retry buttons where appropriate.

---

# 64. Authentication Security

Requirements:

- Hash passwords using bcrypt.
- Use secure JWT secrets.
- Validate JWT on protected endpoints.
- Never return password hashes.
- Validate email addresses.
- Enforce password length.
- Rate-limit login attempts.
- Protect user-owned resources.

A user must NEVER be able to access another user's:

- documents
- conversations
- workspaces
- quizzes
- flashcards

---

# 65. File Security

Uploaded files must be validated.

Check:

```text
File extension
MIME type
File size
User ownership
```

Generate unique stored filenames.

Never trust filenames provided directly by users.

---

# 66. Environment Variables

Never hardcode API keys.

Frontend:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Backend:

```env
PORT=5000

DATABASE_URL=

JWT_SECRET=
JWT_EXPIRES_IN=

AGENT_API_URL=http://localhost:8000

FRONTEND_URL=http://localhost:5173
```

Agent:

```env
AGENT_PORT=8000

DATABASE_URL=

LLM_API_KEY=

LLM_MODEL=

EMBEDDING_MODEL=
```

Actual `.env` files must not be committed.

Provide `.env.example`.

---

# 67. AI Prompt Rules

The Study Agent system prompt should enforce the following behavior:

1. Use retrieved study material first.
2. Do not invent document information.
3. Explain clearly.
4. Adapt to the user's selected explanation level.
5. Keep citations connected to retrieved chunks.
6. Say when information cannot be found.
7. Separate general knowledge from document knowledge.
8. Avoid pretending uncertain information is factual.

Example:

```text
You are Study Mind, an AI study assistant.

Answer the student's question primarily using the
provided study context.

If the answer cannot be found in the context, clearly
state that the selected material does not contain enough
information.

Explain concepts clearly and use examples when useful.

Never invent document citations.
```

---

# 68. Study Mind Personality

Study Mind should feel:

- Helpful
- Calm
- Friendly
- Intelligent
- Encouraging
- Simple

Avoid overly robotic responses.

Avoid unnecessary long responses.

Example:

Instead of:

> Based upon the provided contextual information, it can be ascertained...

Use:

> Normalization helps organize your database so the same information is not unnecessarily repeated.

---

# 69. AI Companion Visual

The reference images contain friendly robot characters.

Study Mind can use a similar **concept** of an AI companion, but should have its own original character/design.

The companion may appear on:

- Landing page
- Empty states
- AI loading screen
- Welcome dashboard
- Study Agent introduction

Do NOT display the character everywhere.

It should support the UI rather than distract from studying.

---

# 70. Accessibility

Requirements:

- Proper HTML labels
- Keyboard-accessible controls
- Visible focus states
- Sufficient text contrast
- Semantic HTML
- Accessible buttons
- Alt text for meaningful images
- `aria-label` for icon-only controls

Do not rely only on color to communicate state.

---

# 71. Performance Requirements

Frontend:

- Lazy load major routes.
- Compress images.
- Avoid unnecessary rerenders.
- Avoid huge dependencies.
- Show loading states.

Backend:

- Paginate large lists.
- Validate queries.
- Use database indexes.
- Avoid unnecessary database calls.

Agent:

- Do not embed documents repeatedly.
- Store embeddings after processing.
- Limit retrieved chunks.
- Limit context sent to LLM.
- Cache reusable results where appropriate.

---

# 72. Recommended RAG Configuration

Initial development configuration:

```text
Chunk Size:
800–1200 tokens

Chunk Overlap:
100–200 tokens

Retrieved Chunks:
4–8
```

These values should be configurable rather than hardcoded throughout the application.

---

# 73. Search Strategy

Initial version:

```text
Vector similarity search
```

Intermediate version:

```text
Vector Search
      +
Keyword Search
      ↓
Hybrid Retrieval
```

This can improve results when users search exact technical terms.

---

# 74. Logging

Backend should log:

- API errors
- Failed authentication
- Document upload failures
- Agent communication errors

Agent should log:

- Extraction failures
- Embedding failures
- Retrieval errors
- LLM errors

Do NOT log:

- passwords
- JWT tokens
- API keys
- sensitive authentication information

---

# 75. Development Rules

## Rule 1 — Separation of Concerns

Do not place everything in one file.

Bad:

```text
App.jsx
```

containing the entire frontend.

Bad:

```text
server.js
```

containing every API.

Bad:

```text
main.py
```

containing the entire AI system.

---

## Rule 2 — Component Responsibility

Each important component gets its own file.

Example:

```text
Navbar/
├── Navbar.jsx
└── Navbar.css
```

Not:

```text
CommonComponents.jsx
```

containing Navbar, Sidebar, Modal, Button and Input together.

---

## Rule 3 — Page Responsibility

Pages compose components.

Pages should not contain large amounts of reusable UI logic.

---

## Rule 4 — Service Responsibility

External API/database/business operations belong in services.

Example:

```text
chatController.js
        ↓
chatService.js
        ↓
agentService.js
```

---

## Rule 5 — No Duplicate Components

Before creating a new component, check whether an existing common component can be reused.

---

# 76. Naming Conventions

React components:

```text
PascalCase
```

Example:

```text
DocumentCard.jsx
StudyAgent.jsx
ChatInput.jsx
```

JavaScript functions:

```text
camelCase
```

Example:

```text
uploadDocument()
generateQuiz()
getWorkspace()
```

Python:

```text
snake_case
```

Example:

```text
generate_embeddings()
retrieve_documents()
process_document()
```

Constants:

```text
UPPER_SNAKE_CASE
```

Example:

```text
MAX_FILE_SIZE
DEFAULT_CHUNK_SIZE
```

---

# 77. Git Requirements

Use branches such as:

```text
main
develop

feature/auth
feature/document-upload
feature/rag
feature/study-agent
feature/quiz
feature/flashcards
```

Use meaningful commits.

Good:

```text
feat: add document upload endpoint

feat: implement RAG retrieval pipeline

fix: prevent unauthorized workspace access

style: improve mobile study agent layout
```

Bad:

```text
changes

update

fix stuff
```

---

# 78. Testing

Frontend should test important UI flows.

Backend should test:

- Registration
- Login
- Protected routes
- Workspace ownership
- Document ownership
- File validation

Agent should test:

- Document extraction
- Chunking
- Retrieval
- Source metadata
- Invalid documents
- Empty retrieval results

---

# 79. MVP Scope

The first complete version should focus on:

```text
Authentication
       ↓
Workspace
       ↓
Document Upload
       ↓
Document Processing
       ↓
Embeddings
       ↓
RAG
       ↓
Study Agent
       ↓
Source Citations
       ↓
Conversation History
```

These features should work correctly before adding advanced functionality.

---

# 80. Phase 2

After MVP:

```text
Summary Generator
Quiz Generator
Flashcards
Global Search
Study Statistics
AI Preferences
```

---

# 81. Phase 3

Possible future improvements:

```text
OCR for scanned PDFs

Image understanding

Lecture audio transcription

YouTube lecture import

Spaced repetition

Study plans

Exam preparation mode

Collaborative workspaces

Shared notes

Web research

Calendar integration

Voice conversation

Mobile application
```

These are NOT required for the initial MVP.

---

# 82. MVP User Journey

A complete user journey should work like this:

```text
1. User opens Study Mind.

2. User creates an account.

3. User enters the dashboard.

4. User creates:
   "Database Systems"

5. User uploads:
   "Lecture-01.pdf"

6. Study Mind shows:
   "Processing..."

7. Python extracts and indexes the document.

8. Status changes:
   "Ready"

9. User opens Study Agent.

10. User selects:
    "Database Systems"

11. User asks:
    "What is normalization?"

12. Study Mind retrieves relevant lecture sections.

13. AI generates an explanation.

14. The answer shows:
    "Lecture-01.pdf — Page 12"

15. User asks a follow-up question.

16. Conversation is saved.

17. User returns later and continues the conversation.
```

If this entire flow works reliably, the core MVP is successful.

---

# 83. Example Dashboard UI

The dashboard should conceptually look like:

```text
┌──────────────────────────────────────────────────────────────┐
│ Study Mind                                      Alex ▾       │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│ Home         │  Good evening, Alex.                          │
│ Knowledge    │  What are we learning today?                  │
│ Study Agent  │                                               │
│ Study Tools  │  ┌─────────────────────────────────────────┐  │
│ History      │  │ Ask Study Mind anything...             │  │
│              │  └─────────────────────────────────────────┘  │
│              │                                               │
│              │  Continue Studying                            │
│              │                                               │
│              │  ┌────────────────┐ ┌────────────────────┐   │
│              │  │ Database       │ │ Operating Systems  │   │
│              │  │ 12 documents   │ │ 8 documents        │   │
│              │  └────────────────┘ └────────────────────┘   │
│              │                                               │
│ Settings     │  Recent Documents                             │
│ Profile      │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

The actual implementation should be cleaner and more visual than the ASCII representation.

---

# 84. Example Study Agent UI

```text
┌──────────────────────────────────────────────────────────────┐
│ Study Mind                                                   │
├──────────────────┬───────────────────────────────────────────┤
│                  │                                           │
│ New Chat         │  Study Mind                               │
│                  │                                           │
│ Today            │  How can I help you study?                │
│                  │                                           │
│ Normalization    │        ┌─────────────────────────────┐    │
│ Deadlocks        │        │ What is normalization?      │    │
│ SQL Joins        │        └─────────────────────────────┘    │
│                  │                                           │
│ Yesterday        │  Normalization is a process used to...    │
│                  │                                           │
│ ER Diagram       │  Sources                                  │
│                  │  Lecture 03.pdf • Page 8                  │
│                  │                                           │
│                  ├───────────────────────────────────────────┤
│                  │ Ask from your study material...      ↑    │
└──────────────────┴───────────────────────────────────────────┘
```

---

# 85. What Makes Study Mind Different

Study Mind should not be marketed or designed simply as:

> Upload PDF and chat with it.

The application should instead focus on:

> Build your personal learning knowledge base and use an AI study companion to understand, revise and test yourself using your own material.

The combination should be:

```text
Personal Knowledge Base
        +
RAG
        +
AI Study Companion
        +
Source Citations
        +
Study Tools
        +
Knowledge Organization
```

---

# 86. Important Product Principle

Study Mind should follow:

> AI should help the student understand their knowledge, not replace the learning process.

Therefore AI features should focus on:

- Explanation
- Retrieval
- Summarization
- Comparison
- Revision
- Question generation
- Flashcards

rather than simply completing every academic task for the student.

---

# 87. UI Principle

When implementing the interface, always prefer:

```text
Simple > Decorative

Clear > Complex

Smooth > Animated

Useful > Impressive-looking

Consistent > Experimental
```

The reference images should influence:

- rounded shapes
- friendly AI character
- clean cards
- large whitespace
- soft surfaces
- approachable interface

They should NOT cause unnecessary decorative elements to be added.

---

# 88. Final Development Requirement

The final Study Mind repository must maintain clear separation:

```text
study-mind/

frontend/
    ONLY React/frontend-related code

backend/
    ONLY Node.js/backend-related code

agent/
    ONLY Python/AI-related code
```

Components, controllers, services, routes, middleware, utilities, RAG logic, document processors and other responsibilities should each have their own logical folders and files.

Avoid monolithic files.

Avoid duplicate code.

Avoid unnecessary dependencies.

Avoid excessive animation.

Avoid randomly generated decorative UI elements.

The finished application should feel like a polished, friendly and focused AI study product built around the four primary project colors:

#000000
#CB2957
#DDDDDD
#EEEEEE
