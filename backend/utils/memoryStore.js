// In-memory data store for standalone running without MongoDB daemon
const memoryStore = {
  users: [],
  categories: [],
  posts: [],
  comments: []
};

// Helper generator for mock MongoDB IDs
const generateId = () => Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

module.exports = { memoryStore, generateId };
