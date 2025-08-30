// package.json
{
  "name": "taskflow-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.3.0",
    "react-scripts": "5.0.1",
    "axios": "^0.27.2"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default App;

// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/register', userData),
  login: (credentials) => api.post('/login', credentials),
};

export const taskAPI = {
  getTasks: () => api.get('/tasks'),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export default api;

// src/components/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>TaskFlow</h1>
          <h2>Iniciar Sesión</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Usuario:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;

// src/components/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      navigate('/login', { 
        state: { message: 'Usuario registrado exitosamente. Inicia sesión.' }
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>TaskFlow</h1>
          <h2>Crear Cuenta</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Usuario:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;

// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskAPI } from '../services/api';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const { user, logout } = useAuth();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getTasks();
      setTasks(response.data.tasks);
    } catch (error) {
      setError('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await taskAPI.createTask(taskData);
      setTasks([...tasks, response.data.task]);
      setShowForm(false);
    } catch (error) {
      setError('Error al crear la tarea');
    }
  };

  const handleUpdateTask = async (id, taskData) => {
    try {
      const response = await taskAPI.updateTask(id, taskData);
      setTasks(tasks.map(task => 
        task.id === id ? response.data.task : task
      ));
      setEditingTask(null);
    } catch (error) {
      setError('Error al actualizar la tarea');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await taskAPI.deleteTask(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      setError('Error al eliminar la tarea');
    }
  };

  const handleToggleComplete = async (task) => {
    await handleUpdateTask(task.id, { ...task, completed: !task.completed });
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>TaskFlow</h1>
          <div className="user-info">
            <span>Bienvenido, {user?.username}!</span>
            <button onClick={logout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total de Tareas</h3>
            <p className="stat-number">{totalTasks}</p>
          </div>
          <div className="stat-card">
            <h3>Completadas</h3>
            <p className="stat-number">{completedTasks}</p>
          </div>
          <div className="stat-card">
            <h3>Pendientes</h3>
            <p className="stat-number">{totalTasks - completedTasks}</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="task-controls">
          <button 
            onClick={() => setShowForm(true)}
            className="add-task-button"
          >
            + Nueva Tarea
          </button>
        </div>

        {showForm && (
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowForm(false)}
          />
        )}

        {editingTask && (
          <TaskForm
            task={editingTask}
            onSubmit={(taskData) => handleUpdateTask(editingTask.id, taskData)}
            onCancel={() => setEditingTask(null)}
            isEditing={true}
          />
        )}

        {loading ? (
          <div className="loading">Cargando tareas...</div>
        ) : (
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;

// src/components/TaskForm.js
import React, { useState, useEffect } from 'react';

const TaskForm = ({ task, onSubmit, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });

  useEffect(() => {
    if (isEditing && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
      });
    }
  }, [task, isEditing]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    if (!isEditing) {
      setFormData({ title: '', description: '', priority: 'medium' });
    }
  };

  return (
    <div className="task-form-overlay">
      <div className="task-form">
        <h3>{isEditing ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Título *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="priority">Prioridad</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancelar
            </button>
            <button type="submit" className="submit-button">
              {isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;

// src/components/TaskList.js
import React from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, onToggleComplete, onEdit, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <h3>No tienes tareas aún</h3>
        <p>¡Crea tu primera tarea para comenzar!</p>
      </div>
    );
  }

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="task-list">
      {pendingTasks.length > 0 && (
        <div className="task-section">
          <h3>Tareas Pendientes ({pendingTasks.length})</h3>
          <div className="tasks">
            {pendingTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="task-section">
          <h3>Tareas Completadas ({completedTasks.length})</h3>
          <div className="tasks">
            {completedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;

// src/components/TaskItem.js
import React from 'react';

const TaskItem = ({ task, onToggleComplete, onEdit, onDelete }) => {
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'low': return 'Baja';
      default: return 'Media';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-content">
        <div className="task-header">
          <div className="task-checkbox">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleComplete(task)}
            />
          </div>
          <h4 className="task-title">{task.title}</h4>
          <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
            {getPriorityText(task.priority)}
          </span>
        </div>
        
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        
        <div className="task-meta">
          <span className="task-date">
            Creada: {formatDate(task.created_at)}
          </span>
          {task.updated_at !== task.created_at && (
            <span className="task-date">
              Actualizada: {formatDate(task.updated_at)}
            </span>
          )}
        </div>
      </div>
      
      <div className="task-actions">
        <button
          onClick={() => onEdit(task)}
          className="edit-button"
          title="Editar tarea"
        >
          ✏️
        </button>
        <button
          onClick={() => {
            if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
              onDelete(task.id);
            }
          }}
          className="delete-button"
          title="Eliminar tarea"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default TaskItem;