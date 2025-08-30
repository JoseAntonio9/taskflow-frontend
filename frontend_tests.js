// src/components/__tests__/Login.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthProvider } from '../../contexts/AuthContext';
import * as api from '../../services/api';

// Mock del módulo de API
jest.mock('../../services/api');

// Componente wrapper para las pruebas
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form correctly', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByText('TaskFlow')).toBeInTheDocument();
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario:')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByText(/¿No tienes cuenta?/)).toBeInTheDocument();
  });

  test('handles input changes correctly', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText('Usuario:');
    const passwordInput = screen.getByLabelText('Contraseña:');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('testpass');
  });

  test('shows loading state during login', async () => {
    // Mock de API que simula delay
    api.authAPI.login.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText('Usuario:');
    const passwordInput = screen.getByLabelText('Contraseña:');
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('displays error message on login failure', async () => {
    api.authAPI.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } }
    });

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText('Usuario:');
    const passwordInput = screen.getByLabelText('Contraseña:');
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('successful login redirects to dashboard', async () => {
    const mockNavigate = jest.fn();
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    api.authAPI.login.mockResolvedValue({
      data: {
        token: 'fake-token',
        user: { id: 1, username: 'testuser' }
      }
    });

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText('Usuario:');
    const passwordInput = screen.getByLabelText('Contraseña:');
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.authAPI.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass'
      });
    });
  });
});

// src/components/__tests__/TaskForm.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskForm from '../TaskForm';

describe('TaskForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders create form correctly', () => {
    render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByText('Nueva Tarea')).toBeInTheDocument();
    expect(screen.getByLabelText('Título *')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByLabelText('Prioridad')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  test('renders edit form with task data', () => {
    const mockTask = {
      title: 'Test Task',
      description: 'Test Description',
      priority: 'high'
    };

    render(
      <TaskForm 
        task={mockTask}
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
        isEditing={true}
      />
    );

    expect(screen.getByText('Editar Tarea')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('high')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument();
  });

  test('handles form submission correctly', () => {
    render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const titleInput = screen.getByLabelText('Título *');
    const descriptionInput = screen.getByLabelText('Descripción');
    const prioritySelect = screen.getByLabelText('Prioridad');
    const submitButton = screen.getByRole('button', { name: /crear/i });

    fireEvent.change(titleInput, { target: { value: 'New Task' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
    fireEvent.change(prioritySelect, { target: { value: 'high' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'New Description',
      priority: 'high'
    });
  });

  test('handles form cancellation', () => {
    render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('requires title field', () => {
    render(
      <TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const titleInput = screen.getByLabelText('Título *');
    const submitButton = screen.getByRole('button', { name: /crear/i });

    fireEvent.click(submitButton);

    expect(titleInput).toBeInvalid();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});

// src/components/__tests__/TaskItem.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskItem from '../TaskItem';

describe('TaskItem Component', () => {
  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    completed: false,
    priority: 'medium',
    created_at: '2024-08-20T10:00:00Z',
    updated_at: '2024-08-20T10:00:00Z'
  };

  const mockOnToggleComplete = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders task correctly', () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Media')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  test('renders completed task with line-through', () => {
    const completedTask = { ...mockTask, completed: true };

    render(
      <TaskItem
        task={completedTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const taskElement = screen.getByText('Test Task').closest('.task-item');
    expect(taskElement).toHaveClass('completed');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  test('handles checkbox toggle', () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnToggleComplete).toHaveBeenCalledWith(mockTask);
  });

  test('handles edit button click', () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByTitle('Editar tarea');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  test('handles delete button click with confirmation', () => {
    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByTitle('Eliminar tarea');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
  });

  test('cancels delete when confirmation is declined', () => {
    window.confirm = jest.fn(() => false);

    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByTitle('Eliminar tarea');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  test('displays correct priority badges', () => {
    const { rerender } = render(
      <TaskItem
        task={{ ...mockTask, priority: 'high' }}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Alta')).toBeInTheDocument();

    rerender(
      <TaskItem
        task={{ ...mockTask, priority: 'low' }}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Baja')).toBeInTheDocument();
  });

  test('formats dates correctly', () => {
    render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockOnToggleComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/Creada:/)).toBeInTheDocument();
  });
});

// src/contexts/__tests__/AuthContext.test.js
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Componente de prueba
const TestComponent = () => {
  const { user, token, login, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      <div>User: {user ? user.username : 'No user'}</div>
      <div>Token: {token || 'No token'}</div>
      <div>Authenticated: {isAuthenticated.toString()}</div>
      <button onClick={() => login('test-token', { username: 'testuser' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('provides initial state correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('User: No user')).toBeInTheDocument();
    expect(screen.getByText('Token: No token')).toBeInTheDocument();
    expect(screen.getByText('Authenticated: false')).toBeInTheDocument();
  });

  test('handles login correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    
    act(() => {
      loginButton.click();
    });

    expect(screen.getByText('User: testuser')).toBeInTheDocument();
    expect(screen.getByText('Token: test-token')).toBeInTheDocument();
    expect(screen.getByText('Authenticated: true')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('test-token');
    expect(localStorage.getItem('user')).toBe('{"username":"testuser"}');
  });

  test('handles logout correctly', () => {
    // Simular usuario logueado
    localStorage.setItem('token', 'existing-token');
    localStorage.setItem('user', '{"username":"existinguser"}');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Verificar estado inicial
    expect(screen.getByText('User: existinguser')).toBeInTheDocument();

    const logoutButton = screen.getByText('Logout');
    
    act(() => {
      logoutButton.click();
    });

    expect(screen.getByText('User: No user')).toBeInTheDocument();
    expect(screen.getByText('Token: No token')).toBeInTheDocument();
    expect(screen.getByText('Authenticated: false')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('loads existing token from localStorage', () => {
    localStorage.setItem('token', 'stored-token');
    localStorage.setItem('user', '{"username":"storeduser"}');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('User: storeduser')).toBeInTheDocument();
    expect(screen.getByText('Token: stored-token')).toBeInTheDocument();
    expect(screen.getByText('Authenticated: true')).toBeInTheDocument();
  });
});