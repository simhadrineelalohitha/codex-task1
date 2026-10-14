/**
 * auth.js - User Session, Sidebar Profile Pill & Auth Handlers
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (API.getToken()) {
    try {
      await API.getMe();
    } catch (e) {
      console.warn('Session expired or invalid, clearing credentials.');
      API.clearAuth();
    }
  }

  renderAuthElements();
  initAuthForms();
});

function renderAuthElements() {
  const sidebarUser = document.getElementById('sidebarUserContainer');
  const sidebarProfileLink = document.getElementById('sidebarProfileLink');
  const mobileProfileLink = document.getElementById('mobileProfileLink');
  const currentUser = API.getUser();

  if (currentUser) {
    const profileHref = `/profile.html?username=${encodeURIComponent(currentUser.username)}`;
    if (sidebarProfileLink) sidebarProfileLink.href = profileHref;
    if (mobileProfileLink) mobileProfileLink.href = profileHref;

    if (sidebarUser) {
      const avatarHtml = currentUser.avatar
        ? `<img src="${currentUser.avatar}" alt="${API.escapeHtml(currentUser.displayName)}" class="avatar-img avatar-sm">`
        : `<div class="avatar-placeholder avatar-sm">${currentUser.displayName.charAt(0).toUpperCase()}</div>`;

      sidebarUser.innerHTML = `
        <a href="${profileHref}" class="user-pill-info">
          ${avatarHtml}
          <div class="user-pill-meta">
            <span class="user-pill-name">${API.escapeHtml(currentUser.displayName)}</span>
            <span class="user-pill-handle">@${API.escapeHtml(currentUser.username)}</span>
          </div>
        </a>
        <button id="logoutBtn" class="btn-logout" title="Log out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      `;

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          API.logout();
        });
      }
    }
  } else {
    if (sidebarProfileLink) sidebarProfileLink.href = '/login.html';
    if (mobileProfileLink) mobileProfileLink.href = '/login.html';

    if (sidebarUser) {
      sidebarUser.innerHTML = `
        <div style="display: flex; gap: 0.5rem; width: 100%;">
          <a href="/login.html" class="btn btn-outline btn-sm" style="flex: 1; text-align: center;">Log In</a>
          <a href="/register.html" class="btn btn-primary btn-sm" style="flex: 1; text-align: center;">Sign Up</a>
        </div>
      `;
    }
  }
}

function initAuthForms() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('authError');
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (errorEl) errorEl.textContent = '';

      const usernameOrEmail = document.getElementById('usernameOrEmail').value.trim();
      const password = document.getElementById('password').value;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        await API.login(usernameOrEmail, password);
        window.location.href = '/';
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message || 'Login failed. Please check credentials.';
          errorEl.classList.remove('hidden');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('authError');
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      if (errorEl) errorEl.textContent = '';

      const displayName = document.getElementById('displayName').value.trim();
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        await API.register(username, email, password, displayName);
        window.location.href = '/';
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message || 'Registration failed.';
          errorEl.classList.remove('hidden');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }
}
