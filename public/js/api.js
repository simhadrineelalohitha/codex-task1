/**
 * api.js - Centralized Fetch & Token Helper
 */
const API = {
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async request(endpoint, options = {}) {
    const url = `/api${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.clearAuth();
          if (window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html') {
            // Optional redirect or trigger event
          }
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'} ${url}]:`, error);
      throw error;
    }
  },

  // Auth Endpoints
  async register(username, email, password, displayName) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, displayName })
    });
    if (res.token) {
      this.setToken(res.token);
      this.setUser(res.user);
    }
    return res;
  },

  async login(usernameOrEmail, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password })
    });
    if (res.token) {
      this.setToken(res.token);
      this.setUser(res.user);
    }
    return res;
  },

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API failed:', e);
    } finally {
      this.clearAuth();
      window.location.href = '/login.html';
    }
  },

  async getMe() {
    const res = await this.request('/auth/me');
    if (res.user) {
      this.setUser(res.user);
    }
    return res.user;
  },

  // Posts Endpoints
  async getFeed(filter = 'all') {
    return await this.request(`/posts?filter=${filter}`);
  },

  async createPost(content, imageUrl = '') {
    return await this.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ content, imageUrl })
    });
  },

  async getPostById(id) {
    return await this.request(`/posts/${id}`);
  },

  async deletePost(id) {
    return await this.request(`/posts/${id}`, {
      method: 'DELETE'
    });
  },

  async toggleLike(id) {
    return await this.request(`/posts/${id}/like`, {
      method: 'POST'
    });
  },

  // Comments Endpoints
  async getComments(postId) {
    return await this.request(`/comments/post/${postId}`);
  },

  async addComment(postId, content) {
    return await this.request(`/comments/post/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  async deleteComment(commentId) {
    return await this.request(`/comments/${commentId}`, {
      method: 'DELETE'
    });
  },

  // User & Profile Endpoints
  async getProfile(username) {
    return await this.request(`/users/${username}`);
  },

  async updateProfile(displayName, bio, avatar) {
    const res = await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ displayName, bio, avatar })
    });
    if (res.user) {
      this.setUser(res.user);
    }
    return res;
  },

  async toggleFollow(userId) {
    return await this.request(`/users/${userId}/follow`, {
      method: 'POST'
    });
  },

  // Utility: format relative time
  timeAgo(dateString) {
    const date = new Date(dateString + (dateString.endsWith('Z') ? '' : 'Z'));
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (isNaN(seconds) || seconds < 0) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;

    const years = Math.floor(days / 365);
    return `${years}y ago`;
  },

  // Escape HTML helper
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
