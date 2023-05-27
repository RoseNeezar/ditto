export const tasks = [
  {
    id: 1,
    col_id: 1,
    name: "Remove unused tests",
    priority_id: 1,
    assignee: {
      id: 1,
      last_name: "Doe",
      first_name: "John",
    },
  },
  {
    id: 2,
    col_id: 2,
    name: "Integrate Ant Design",
    priority_id: 2,
    assignee: {
      id: 1,
      last_name: "Doe",
      first_name: "John",
    },
  },
  {
    id: 3,
    col_id: 2,
    name: "Fix typo in config",
    priority_id: 3,
    assignee: {
      id: 1,
      last_name: "Doe",
      first_name: "John",
    },
  },
  {
    id: 4,
    col_id: 2,
    name: "Improve typescript setup",
    priority_id: 2,
    comments_count: 3,
    assignee: {
      id: 1,
      last_name: "Doe",
      first_name: "John",
    },
  },
  {
    id: 5,
    col_id: 2,
    name: "Update LICENSE.md",
    priority_id: 4,
    assignee: {
      id: 1,
      last_name: "Doe",
      first_name: "John",
    },
  },
  {
    id: 6,
    col_id: 1,
    name: "Enable config for all files",
    priority_id: 1,
    comments_count: 11,
    assignee: {
      id: 1,
      last_name: "Doe",
      first_name: "John",
    },
  },
  {
    id: 7,
    col_id: 1,
    name: "Migrate backend Python version from 2.6 to 3.11",
    priority_id: 1,
    assignee: {
      id: 1,
      last_name: "Doe",
      first_name: "John",
    },
  },
  {
    id: 8,
    col_id: 1,
    name: "Try to put out that fire we started 🔥",
    priority_id: 1,
    comments_count: "999+",
    assignee: {
      id: 1,
      last_name: "Doe",
      first_name: "John",
    },
  },
  {
    id: 9,
    col_id: 1,
    name: "Check cookie when needed",
    priority_id: 1,
    comments_count: "1",
    assignee: {
      id: 1,
      last_name: "Doe",
      first_name: "John",
    },
  },
];

export const columns = [
  { id: 1, name: "Backlog", order: 0 },
  { id: 2, name: "In progress", order: 1 },
  { id: 3, name: "Done", order: 2 },
];
