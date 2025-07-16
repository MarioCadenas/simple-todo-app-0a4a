
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a todo title', async () => {
    // Create a test todo first
    const created = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: created[0].id,
      title: 'Updated Title'
    };

    const result = await updateTodo(testInput);

    expect(result.id).toEqual(created[0].id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(created[0].updated_at.getTime());
  });

  it('should update todo description', async () => {
    // Create a test todo first
    const created = await db.insert(todosTable)
      .values({
        title: 'Test Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: created[0].id,
      description: 'Updated description'
    };

    const result = await updateTodo(testInput);

    expect(result.id).toEqual(created[0].id);
    expect(result.title).toEqual('Test Title'); // Unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update todo completion status', async () => {
    // Create a test todo first
    const created = await db.insert(todosTable)
      .values({
        title: 'Test Title',
        description: 'Test description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: created[0].id,
      completed: true
    };

    const result = await updateTodo(testInput);

    expect(result.id).toEqual(created[0].id);
    expect(result.title).toEqual('Test Title'); // Unchanged
    expect(result.description).toEqual('Test description'); // Unchanged
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    // Create a test todo first
    const created = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: created[0].id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(testInput);

    expect(result.id).toEqual(created[0].id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    // Create a test todo first
    const created = await db.insert(todosTable)
      .values({
        title: 'Test Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: created[0].id,
      description: null
    };

    const result = await updateTodo(testInput);

    expect(result.id).toEqual(created[0].id);
    expect(result.title).toEqual('Test Title'); // Unchanged
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated todo to database', async () => {
    // Create a test todo first
    const created = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();

    const testInput: UpdateTodoInput = {
      id: created[0].id,
      title: 'Updated Title',
      completed: true
    };

    const result = await updateTodo(testInput);

    // Verify the update was persisted in the database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Title');
    expect(todos[0].description).toEqual('Original description'); // Unchanged
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when todo not found', async () => {
    const testInput: UpdateTodoInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    await expect(updateTodo(testInput)).rejects.toThrow(/Todo with id 999 not found/i);
  });
});
