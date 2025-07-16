
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Circle, Edit, Trash2, Plus, Calendar, Wifi, WifiOff } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [nextId, setNextId] = useState(1);

  // Form state for creating new todos
  const [newTodoForm, setNewTodoForm] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Form state for editing todos
  const [editTodoForm, setEditTodoForm] = useState<UpdateTodoInput>({
    id: 0,
    title: '',
    description: null,
    completed: false
  });

  // Initialize with sample data for demo purposes
  const initializeDemoData = useCallback(() => {
    const demoTodos: Todo[] = [
      {
        id: 1,
        title: "Welcome to your Todo App! 🎉",
        description: "This is a sample todo to get you started. You can edit or delete it.",
        completed: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        title: "Try creating a new todo",
        description: "Use the form above to add your own tasks",
        completed: false,
        created_at: new Date(Date.now() - 86400000), // 1 day ago
        updated_at: new Date(Date.now() - 86400000)
      },
      {
        id: 3,
        title: "Mark todos as complete",
        description: "Click the circle icon to mark tasks as done",
        completed: true,
        created_at: new Date(Date.now() - 172800000), // 2 days ago
        updated_at: new Date()
      }
    ];
    setTodos(demoTodos);
    setNextId(4);
  }, []);

  // Load todos from server with fallback to demo data
  const loadTodos = useCallback(async () => {
    try {
      setError(null);
      setIsOfflineMode(false);
      const result = await trpc.getTodos.query();
      
      // If server returns empty array (stub implementation), use demo data
      if (result.length === 0) {
        initializeDemoData();
        setIsOfflineMode(true);
      } else {
        setTodos(result);
      }
    } catch (error) {
      console.error('Backend not available, using demo mode:', error);
      setIsOfflineMode(true);
      initializeDemoData();
      setError('Backend not available - running in demo mode. Your changes will not be saved.');
    }
  }, [initializeDemoData]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Create new todo with fallback to local state
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoForm.title.trim()) return;

    setIsLoading(true);
    try {
      setError(null);
      
      if (isOfflineMode) {
        // Local demo mode
        const newTodo: Todo = {
          id: nextId,
          title: newTodoForm.title,
          description: newTodoForm.description,
          completed: false,
          created_at: new Date(),
          updated_at: new Date()
        };
        setTodos((prev: Todo[]) => [newTodo, ...prev]);
        setNextId(prev => prev + 1);
        setNewTodoForm({ title: '', description: null });
      } else {
        // Try server
        const newTodo = await trpc.createTodo.mutate(newTodoForm);
        setTodos((prev: Todo[]) => [newTodo, ...prev]);
        setNewTodoForm({ title: '', description: null });
      }
    } catch (error) {
      console.error('Failed to create todo:', error);
      setError('Failed to create todo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle todo completion with fallback
  const handleToggleTodo = async (id: number, completed: boolean) => {
    try {
      setError(null);
      
      if (isOfflineMode) {
        // Local demo mode
        setTodos((prev: Todo[]) =>
          prev.map((todo: Todo) => 
            todo.id === id 
              ? { ...todo, completed, updated_at: new Date() }
              : todo
          )
        );
      } else {
        // Try server
        const updatedTodo = await trpc.toggleTodo.mutate({ id, completed });
        setTodos((prev: Todo[]) =>
          prev.map((todo: Todo) => (todo.id === id ? updatedTodo : todo))
        );
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      setError('Failed to update todo. Please try again.');
    }
  };

  // Delete todo with fallback
  const handleDeleteTodo = async (id: number) => {
    try {
      setError(null);
      
      if (isOfflineMode) {
        // Local demo mode
        setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
      } else {
        // Try server
        await trpc.deleteTodo.mutate({ id });
        setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setError('Failed to delete todo. Please try again.');
    }
  };

  // Open edit dialog
  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTodoForm({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed
    });
    setIsEditDialogOpen(true);
  };

  // Update todo with fallback
  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTodoForm.title?.trim()) return;

    setIsLoading(true);
    try {
      setError(null);
      
      if (isOfflineMode) {
        // Local demo mode
        setTodos((prev: Todo[]) =>
          prev.map((todo: Todo) => 
            todo.id === editTodoForm.id 
              ? { 
                  ...todo, 
                  title: editTodoForm.title || todo.title,
                  description: editTodoForm.description ?? todo.description,
                  completed: editTodoForm.completed ?? todo.completed,
                  updated_at: new Date()
                }
              : todo
          )
        );
      } else {
        // Try server
        const updatedTodo = await trpc.updateTodo.mutate(editTodoForm);
        setTodos((prev: Todo[]) =>
          prev.map((todo: Todo) => (todo.id === editTodoForm.id ? updatedTodo : todo))
        );
      }
      
      setIsEditDialogOpen(false);
      setEditingTodo(null);
    } catch (error) {
      console.error('Failed to update todo:', error);
      setError('Failed to update todo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter todos
  const filteredTodos = todos.filter((todo: Todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const activeCount = todos.filter((todo: Todo) => !todo.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ✨ My Todo App
          </h1>
          <p className="text-gray-600">
            Stay organized and get things done!
          </p>
          
          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 mt-2">
            {isOfflineMode ? (
              <Badge variant="secondary" className="text-sm">
                <WifiOff className="w-3 h-3 mr-1" />
                Demo Mode
              </Badge>
            ) : (
              <Badge variant="outline" className="text-sm">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Create Todo Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <Input
                placeholder="What needs to be done? 🎯"
                value={newTodoForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodoForm((prev: CreateTodoInput) => ({ 
                    ...prev, 
                    title: e.target.value 
                  }))
                }
                className="text-lg"
                required
              />
              <Textarea
                placeholder="Add a description (optional) 📝"
                value={newTodoForm.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNewTodoForm((prev: CreateTodoInput) => ({ 
                    ...prev, 
                    description: e.target.value || null 
                  }))
                }
                className="resize-none"
                rows={3}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !newTodoForm.title.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {isLoading ? 'Creating...' : '✨ Create Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats and Filters */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-sm">
                  📝 Total: {todos.length}
                </Badge>
                <Badge variant="default" className="text-sm">
                  🎯 Active: {activeCount}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  ✅ Completed: {completedCount}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Todo List */}
        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">
                    {filter === 'completed' ? '🎉' : '📋'}
                  </div>
                  <p className="text-gray-500 text-lg">
                    {filter === 'completed' 
                      ? 'No completed todos yet!'
                      : filter === 'active' 
                        ? 'No active todos! Time to add some tasks.'
                        : 'No todos yet! Create your first todo above.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTodos.map((todo: Todo) => (
              <Card key={todo.id} className={`shadow-lg transition-all duration-200 hover:shadow-xl ${
                todo.completed ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleTodo(todo.id, !todo.completed)}
                      className="mt-1 transition-colors duration-200"
                    >
                      {todo.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-medium ${
                        todo.completed 
                          ? 'line-through text-gray-500' 
                          : 'text-gray-900'
                      }`}>
                        {todo.title}
                      </h3>
                      
                      {todo.description && (
                        <p className={`mt-1 text-sm ${
                          todo.completed 
                            ? 'line-through text-gray-400' 
                            : 'text-gray-600'
                        }`}>
                          {todo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        Created: {todo.created_at.toLocaleDateString()}
                        {todo.updated_at.getTime() !== todo.created_at.getTime() && (
                          <span>• Updated: {todo.updated_at.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog 
                        open={isEditDialogOpen && editingTodo?.id === todo.id}
                        onOpenChange={(open) => {
                          setIsEditDialogOpen(open);
                          if (!open) setEditingTodo(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTodo(todo)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Todo</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdateTodo} className="space-y-4">
                            <Input
                              value={editTodoForm.title || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEditTodoForm((prev: UpdateTodoInput) => ({ 
                                  ...prev, 
                                  title: e.target.value 
                                }))
                              }
                              placeholder="Todo title"
                              required
                            />
                            <Textarea
                              value={editTodoForm.description || ''}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setEditTodoForm((prev: UpdateTodoInput) => ({ 
                                  ...prev, 
                                  description: e.target.value || null 
                                }))
                              }
                              placeholder="Description (optional)"
                              rows={3}
                            />
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="completed"
                                checked={editTodoForm.completed || false}
                                onCheckedChange={(checked: boolean) =>
                                  setEditTodoForm((prev: UpdateTodoInput) => ({ 
                                    ...prev, 
                                    completed: checked 
                                  }))
                                }
                              />
                              <label htmlFor="completed" className="text-sm">
                                Mark as completed
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                type="submit" 
                                disabled={isLoading}
                                className="flex-1"
                              >
                                {isLoading ? 'Updating...' : 'Update Todo'}
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{todo.title}"? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        {todos.length > 0 && (
          <div className="mt-8 text-center">
            <Separator className="mb-4" />
            <p className="text-sm text-gray-500">
              {completedCount > 0 && (
                <>🎉 Great job! You've completed {completedCount} task{completedCount === 1 ? '' : 's'}!</>
              )}
              {activeCount > 0 && completedCount > 0 && <br />}
              {activeCount > 0 && (
                <>Keep going! {activeCount} task{activeCount === 1 ? '' : 's'} left to complete.</>
              )}
              {isOfflineMode && (
                <>
                  <br />
                  <span className="text-xs text-amber-600">
                    💡 Running in demo mode - changes are not saved to the server
                  </span>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
