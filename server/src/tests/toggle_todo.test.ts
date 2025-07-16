
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ToggleTodoInput } from '../schema';
import { toggleTodo } from '../handlers/toggle_todo';
import { eq } from 'drizzle-orm';

// Test input for toggling completion
const testToggleInput: ToggleTodoInput = {
  id: 1,
  completed: true
};

describe('toggleTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle todo completion status', async () => {
    // Create a todo first
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A test todo item',
        completed: false
      })
      .execute();

    const result = await toggleTodo(testToggleInput);

    // Verify the completion status was updated
    expect(result.id).toEqual(1);
    expect(result.completed).toEqual(true);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A test todo item');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated completion status to database', async () => {
    // Create a todo first
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A test todo item',
        completed: false
      })
      .execute();

    await toggleTodo(testToggleInput);

    // Verify the database was updated
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, 1))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should toggle from completed to incomplete', async () => {
    // Create a completed todo first
    await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'Already completed',
        completed: true
      })
      .execute();

    const toggleInput: ToggleTodoInput = {
      id: 1,
      completed: false
    };

    const result = await toggleTodo(toggleInput);

    // Verify the completion status was toggled to false
    expect(result.completed).toEqual(false);
    expect(result.title).toEqual('Completed Todo');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent todo', async () => {
    const nonExistentInput: ToggleTodoInput = {
      id: 999,
      completed: true
    };

    await expect(toggleTodo(nonExistentInput)).rejects.toThrow(/Todo with id 999 not found/i);
  });

  it('should update updated_at timestamp', async () => {
    // Create a todo first
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A test todo item',
        completed: false
      })
      .returning()
      .execute();

    const originalUpdatedAt = insertResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await toggleTodo(testToggleInput);

    // Verify updated_at was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
