# News Aggregator API

## Project Overview

This project is a Node.js/TypeScript-based news aggregation API that collects, processes, and serves news articles from multiple sources. It leverages external news APIs and provides endpoints for authentication, user management, and news retrieval. The backend uses Prisma ORM, MongoDB, Redis, BullMQ for job queues, and robust error handling and validation.

## Features

- User authentication (register, login, OTP, password reset)
- News search and aggregation from multiple APIs
- Email notifications and templates
- Job queue management for background tasks
- Modular and scalable architecture

## Folder Structure

- `src/` - Main source code
  - `app/` - Core app logic
  - `modules/` - Feature modules (Auth, User, etc.)
  - `utils/` - Utility functions and email templates
  - `db/` - Database connection
  - `lib/` - Prisma and Redis clients
  - `middleware/` - Express middlewares
  - `routes/` - API route definitions
- `prisma/` - Prisma schema and migrations
- `config/` - Configuration files

## Endpoints

### Auth

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login with credentials
- `POST /api/v1/auth/verify-otp` - Verify OTP for login/registration
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### User

- `GET /api/v1/user/profile` - Get user profile (auth required)
- `PATCH /api/v1/user/profile` - Update user profile

### News

- `GET /api/v1/news/search?q=keyword` - Search news articles by keyword
- `GET /api/v1/news/sources` - List available news sources

## External News APIs Used

### 1. GNews API

- **Endpoint:** https://gnews.io/api/v4/search?q=us&lang=en&apikey=7a6ee0e76822bdd50b8fe031f47afd8d
- **Usage:** Fetches news articles based on search queries and language.
- **Docs:** [GNews API Docs](https://gnews.io/docs/)

### 2. NewsData.io API

- **Endpoint:** https://newsdata.io/api/1/sources?country=US&apikey=pub_c8f4672d49a74e6a880fa971bcb8a4de
- **Usage:** Retrieves a list of news sources by country.
- **Docs:** [NewsData.io API Docs](https://newsdata.io/docs/)

## Example Usage

### Search News (GNews)

```
GET /api/v1/news/search?q=technology
```

### List News Sources (NewsData.io)

```
GET /api/v1/news/sources
```

## Setup & Installation

1. Clone the repository
2. Install dependencies:
	```
	npm install
	```
3. Configure environment variables in `.env`
4. Run database migrations (if needed)
5. Start the server:
	```
	npm run dev
	```

## Technologies Used

- Node.js, TypeScript, Express.js
- Prisma ORM, MongoDB
- Redis, BullMQ
- Nodemailer (for emails)

## License

MIT
