
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        { title: 'First todo', description: 'First description' },
        { title: 'Second todo', description: null },
        { title: 'Third todo', description: 'Third description' }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].title).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].completed).toBe(false);
  });

  it('should return todos ordered by creation date (newest first)', async () => {
    // Create todos with slight delay to ensure different timestamps
    await db.insert(todosTable)
      .values({ title: 'Older todo', description: 'Older description' })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ title: 'Newer todo', description: 'Newer description' })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Newer todo');
    expect(result[1].title).toEqual('Older todo');
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle todos with null descriptions', async () => {
    await db.insert(todosTable)
      .values({ title: 'Todo with null description', description: null })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Todo with null description');
    expect(result[0].description).toBeNull();
  });

  it('should return todos with correct boolean values', async () => {
    await db.insert(todosTable)
      .values([
        { title: 'Incomplete todo', description: 'Not done yet', completed: false },
        { title: 'Complete todo', description: 'Already done', completed: true }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    const incompleteTodo = result.find(t => t.title === 'Incomplete todo');
    const completeTodo = result.find(t => t.title === 'Complete todo');

    expect(incompleteTodo?.completed).toBe(false);
    expect(completeTodo?.completed).toBe(true);
  });
});
