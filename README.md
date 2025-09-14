<img width="1100" height="1123" alt="image" src="https://github.com/user-attachments/assets/4fcdb4d4-9ce7-45d7-938a-64e75406d1dc" />
<img width="949" height="430" alt="image" src="https://github.com/user-attachments/assets/e836f907-e520-40ea-9c12-f999949a4f5b" />
AWS: http://alb-for-ainews-746322662.eu-north-1.elb.amazonaws.com/
TECH STACK
Core Technologies:
- Frontend and Backend Framework: Next.js 15.3.5 
- Database: Prisma ORM with Postgres 
- AI/ML: OpenAI's GPT-4.1-mini via @openai/agents (can used other LLMs using LiteLLM)

Key Dependencies:
- @openai/agents: For AI-powered content curation
- @prisma/client: Database ORM
- next: React framework
- react/react-dom: UI library
- tailwindcss: Utility-first CSS framework

PROJECT STRUCTURE
src/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── page.tsx          # Main application page
│   └── globals.css       # Global styles
├── components/           # Reusable React components
└── lib/                  # Utility functions
    ├── agent.ts          # AI news curation logic
    └── prisma.ts         # Database client

DATABASE SCHEMA

- Post: Curated news content
- Category: News categories
- Source: News sources with URLs

SETUP INSTRUCTIONS
Prerequisites:
- Node.js (v18+)
- npm (v9+)
- OpenAI API key

Troubleshooting
If the AI returns invalid JSON, check the agent's system prompt
Database issues can be resolved by resetting the database: npx prisma migrate reset

Installation:
1. Clone the repository
2. Run: npm install
3. Create .env file with:
   DATABASE_URL="file:./dev.db"
   OPENAI_API_KEY="your-openai-api-key"
4. Initialize DB: npx prisma db push
5. Seed DB: npx prisma db seed
6. Start dev server: npm run dev


