/**
 * profile.js - Production Grade User Profile View, Bio Editing & User Posts
 */
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
});

async function loadProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  let username = urlParams.get('username');
  const currentUser = API.getUser();

  if (!username) {
    if (currentUser) {
      username = currentUser.username;
    } else {
      window.location.href = '/login.html';
      return;
    }
  }

  const profileHeader = document.getElementById('profileHeader');
  const profilePosts = document.getElementById('profilePosts');
  const topHeaderName = document.getElementById('topHeaderName');
  const topHeaderPostsCount = document.getElementById('topHeaderPostsCount');

  try {
    const data = await API.getProfile(username);
    const profile = data.profile;

    if (topHeaderName) topHeaderName.textContent = profile.displayName;
    if (topHeaderPostsCount) topHeaderPostsCount.textContent = `${profile.posts.length} posts`;

    renderProfileHeader(profile);
    renderProfilePosts(profile.posts, profile);
  } catch (err) {
    if (profileHeader) {
      profileHeader.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3 style="color:#fff; margin-bottom:0.4rem;">User not found</h3>
          <p>The profile you are looking for does not exist or has been removed.</p>
          <a href="/" class="btn btn-primary btn-sm" style="margin-top:1rem;">Return to Feed</a>
        </div>
      `;
    }
  }
}

function renderProfileHeader(profile) {
  const profileHeader = document.getElementById('profileHeader');
  if (!profileHeader) return;

  const currentUser = API.getUser();
  const avatarMarkup = profile.avatar
    ? `<img src="${profile.avatar}" alt="${API.escapeHtml(profile.displayName)}" class="profile-avatar-img">`
    : `<div class="avatar-placeholder avatar-lg">${profile.displayName.charAt(0).toUpperCase()}</div>`;

  let actionButtonsHtml = '';

  if (profile.isSelf) {
    actionButtonsHtml = `
      <button id="editProfileBtn" class="btn btn-outline btn-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        <span>Edit Profile</span>
      </button>
    `;
  } else if (currentUser) {
    actionButtonsHtml = `
      <button id="followBtn" class="btn ${profile.isFollowing ? 'btn-outline' : 'btn-primary'} btn-sm">
        ${profile.isFollowing ? 'Following' : 'Follow'}
      </button>
    `;
  } else {
    actionButtonsHtml = `
      <a href="/login.html" class="btn btn-primary btn-sm">Follow</a>
    `;
  }

  // Format joined date if available
  const joinedDate = profile.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : 'Recently';

  profileHeader.innerHTML = `
    <div class="profile-view-wrap">
      <div class="profile-banner"></div>
      
      <div class="profile-header-card">
        <div class="profile-meta-row">
          <div class="profile-avatar-wrap">
            ${avatarMarkup}
          </div>
          <div>
            ${actionButtonsHtml}
          </div>
        </div>

        <div class="profile-details">
          <h2 class="profile-name" id="displayProfileName">${API.escapeHtml(profile.displayName)}</h2>
          <div class="profile-handle">@${API.escapeHtml(profile.username)}</div>
          
          <p class="profile-bio" id="displayProfileBio">
            ${profile.bio ? API.escapeHtml(profile.bio) : '<span style="color:var(--text-muted); font-style:italic;">No bio provided yet.</span>'}
          </p>

          <div style="display:flex; align-items:center; gap:0.4rem; color:var(--text-muted); font-size:0.84rem; margin-top:0.4rem;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>Joined ${joinedDate}</span>
          </div>

          <div class="profile-stats-row">
            <div class="stat-chip">
              <strong id="followersCount">${profile.followersCount}</strong> Followers
            </div>
            <div class="stat-chip">
              <strong>${profile.followingCount}</strong> Following
            </div>
            <div class="stat-chip">
              <strong>${profile.posts.length}</strong> Posts
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Profile Modal Dialog -->
      ${profile.isSelf ? `
        <div id="editProfileModal" class="modal-overlay hidden">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3>Edit Profile</h3>
              <button id="closeEditModal" class="post-options-btn" style="font-size:1.5rem; line-height:1;">&times;</button>
            </div>
            <form id="editProfileForm">
              <div class="modal-body">
                <div class="form-group">
                  <label for="editDisplayName">Name</label>
                  <input type="text" id="editDisplayName" class="form-control" value="${API.escapeHtml(profile.displayName)}" required />
                </div>
                <div class="form-group">
                  <label for="editAvatar">Avatar Image URL</label>
                  <input type="url" id="editAvatar" class="form-control" placeholder="https://example.com/avatar.jpg" value="${API.escapeHtml(profile.avatar || '')}" />
                </div>
                <div class="form-group">
                  <label for="editBio">Bio</label>
                  <textarea id="editBio" class="form-control" rows="3" placeholder="Tell the community about yourself...">${API.escapeHtml(profile.bio || '')}</textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" id="cancelEditBtn" class="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Follow Button Event
  const followBtn = document.getElementById('followBtn');
  if (followBtn) {
    followBtn.addEventListener('click', async () => {
      try {
        const res = await API.toggleFollow(profile.id);
        const followersCountEl = document.getElementById('followersCount');
        if (followersCountEl) followersCountEl.textContent = res.followersCount;

        if (res.isFollowing) {
          followBtn.textContent = 'Following';
          followBtn.classList.remove('btn-primary');
          followBtn.classList.add('btn-outline');
        } else {
          followBtn.textContent = 'Follow';
          followBtn.classList.remove('btn-outline');
          followBtn.classList.add('btn-primary');
        }
      } catch (err) {
        alert(err.message || 'Follow request failed.');
      }
    });
  }

  // Edit Profile Modal Handling
  if (profile.isSelf) {
    const editBtn = document.getElementById('editProfileBtn');
    const modal = document.getElementById('editProfileModal');
    const closeBtn = document.getElementById('closeEditModal');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const editForm = document.getElementById('editProfileForm');

    const openModal = () => modal.classList.remove('hidden');
    const closeModal = () => modal.classList.add('hidden');

    if (editBtn) editBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Close when clicking overlay backdrop
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const displayName = document.getElementById('editDisplayName').value.trim();
        const avatar = document.getElementById('editAvatar').value.trim();
        const bio = document.getElementById('editBio').value.trim();

        try {
          await API.updateProfile(displayName, bio, avatar);
          closeModal();
          loadProfile();
        } catch (err) {
          alert(err.message || 'Failed to update profile.');
        }
      });
    }
  }
}

function renderProfilePosts(posts, profile) {
  const container = document.getElementById('profilePosts');
  if (!container) return;

  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3 style="color:#fff; margin-bottom:0.4rem;">No posts yet</h3>
        <p>@${API.escapeHtml(profile.username)} hasn't published anything yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  posts.forEach(post => {
    container.appendChild(createPostCardElement(post));
  });
}
