// Global mocks for all tests to prevent database connections

// Mock the pg module to prevent real PostgreSQL connections
jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  })),
}));

// Mock dotenv to prevent environment variable loading issues
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  // Allow certain logs but suppress database connection logs
  const message = args.join(" ");
  if (
    message.includes("Connected to database") ||
    message.includes("Database connection") ||
    message.includes("Client does not exist") ||
    message.includes("Pool does not exist")
  ) {
    return; // Suppress database-related logs
  }
  originalConsoleLog.apply(console, args);
};

console.error = (...args) => {
  // Suppress controller error logs during testing as they are expected
  const message = args.join(" ");
  if (
    message.includes("Error in createDocument:") ||
    message.includes("Error in getDocumentById:") ||
    message.includes("Error in updateDocument:") ||
    message.includes("Error in getAllDocuments:") ||
    message.includes("Error creating document:") ||
    message.includes("Error finding document:") ||
    message.includes("Error deleting document:") ||
    message.includes("Error updating document") ||
    message.includes("Error details:") ||
    message.includes("Error code:") ||
    message.includes("Error stack:") ||
    message.includes("Connected to database") ||
    message.includes("Database connection") ||
    message.includes("Client does not exist") ||
    message.includes("Pool does not exist")
  ) {
    return; // Suppress expected error logs during testing
  }
  originalConsoleError.apply(console, args);
};
