# Document Management Web Application

A full-stack web application for document management with real-time collaboration features, built with React, Node.js, Express, PostgreSQL, and WebSockets.

## Features

- Create, read, update, and delete documents
- Real-time collaborative editing using WebSockets
- Document sharing functionality
- Responsive UI for desktop and mobile devices

## Project Structure

```
/
├── client/                 # Frontend React application
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── services/       # API and WebSocket services
│       ├── App.js
│       └── index.js
│
├── server/                 # Backend Node.js/Express application
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── db/                 # Database setup and migrations
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   ├── websocket/          # WebSocket handlers
│   └── server.js           # Main server file
│
└── README.md
```

## API Endpoints

### Document Management

| Method | Endpoint           | Description             |
| ------ | ------------------ | ----------------------- |
| POST   | /api/documents     | Insert new document     |
| GET    | /api/documents/:id | Retrieve document by ID |
| PUT    | /api/documents/:id | Update document         |
| DELETE | /api/documents/:id | Delete a document       |
| GET    | /api/documents     | Retrieve all documents  |

### Document Sharing

| Method | Endpoint                       | Description                 |
| ------ | ------------------------------ | --------------------------- |
| POST   | /api/documents/:id/share       | Generate or update share ID |
| GET    | /api/documents/:id/share-url   | Retrieve share URL          |
| GET    | /api/documents/shared/:shareId | Retrieve shared document    |

### WebSocket Events

| Event            | Description                           |
| ---------------- | ------------------------------------- |
| join-document    | Join a document for real-time editing |
| updated-document | Update document content               |
| leave-document   | Leave a document                      |

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL database

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd document-management-app
```

2. Install server dependencies:

```bash
cd server
npm install
```

3. Configure environment variables:

   - Copy `.env.example` to `.env`
   - Update database connection details

4. Run database migrations:

```bash
npm run migrate
```

5. Install client dependencies:

```bash
cd ../client
npm install
```

### Running the Application

1. Start the server:

```bash
cd server
npm run dev
```

2. Start the client:

```bash
cd client
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Backend

The backend is configured for deployment on Render:

1. Create a new Web Service on Render
2. Link to your GitHub repository
3. Choose "Use render.yaml from the repo"
4. The render.yaml file will automatically:
   - Build the client application
   - Install server dependencies
   - Configure the environment
5. Add your database connection details in the Environment Variables section

### Alternative Manual Configuration

If you prefer to configure manually:

1. Create a new Web Service on Render
2. Link to your GitHub repository
3. Set the build command to `cd client && npm install && npm run build && cd ../server && npm install`
4. Set the start command to `cd server && node server.js`
5. Set the environment variable `NODE_ENV` to `production`
6. Add your database connection details (either `RENDER_POSTGRES_URL` or individual connection parameters)

## Database

The application uses PostgreSQL for data storage. The schema includes:

- `documents` table with fields for id, title, content, created_at, updated_at, and share_id.
