/**
 * feed.js - Rich Post Composer, Feed Rendering, Comments & Micro-interactions
 */
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initFeed();
});

function initFeed() {
  const currentUser = API.getUser();
  const createBox = document.getElementById('createPostContainer');
  const guestBanner = document.getElementById('guestBanner');

  if (currentUser) {
    if (createBox) createBox.classList.remove('hidden');
    if (guestBanner) guestBanner.classList.add('hidden');
    setupComposer();
  } else {
    if (createBox) createBox.classList.add('hidden');
    if (guestBanner) guestBanner.classList.remove('hidden');
  }

  // Filter Tabs ("For You" vs "Following")
  const tabAll = document.getElementById('tabAll');
  const tabFollowing = document.getElementById('tabFollowing');

  if (tabAll && tabFollowing) {
    tabAll.addEventListener('click', () => {
      tabAll.classList.add('active');
      tabFollowing.classList.remove('active');
      currentFilter = 'all';
      loadFeed();
    });

    tabFollowing.addEventListener('click', () => {
      if (!API.getUser()) {
        alert('Please log in to view posts from creators you follow.');
        return;
      }
      tabFollowing.classList.add('active');
      tabAll.classList.remove('active');
      currentFilter = 'following';
      loadFeed();
    });
  }

  // Sidebar "New Post" Button scroll & focus
  const newPostBtn = document.getElementById('sidebarNewPostBtn');
  if (newPostBtn) {
    newPostBtn.addEventListener('click', () => {
      if (!API.getUser()) {
        window.location.href = '/login.html';
        return;
      }
      const textarea = document.getElementById('postContent');
      if (textarea) {
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        textarea.focus();
      }
    });
  }

  // Search input filter in feed
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const cards = document.querySelectorAll('.post-card');
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (!query || text.includes(query)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  loadFeed();
}

function setupComposer() {
  const form = document.getElementById('createPostForm');
  if (!form) return;

  const currentUser = API.getUser();
  const creatorAvatar = document.getElementById('currentUserAvatar');
  if (creatorAvatar) {
    if (currentUser.avatar) {
      creatorAvatar.innerHTML = `<img src="${currentUser.avatar}" alt="${API.escapeHtml(currentUser.displayName)}" class="avatar-img avatar-md">`;
    } else {
      creatorAvatar.innerHTML = `<div class="avatar-placeholder avatar-md">${currentUser.displayName.charAt(0).toUpperCase()}</div>`;
    }
  }

  const contentInput = document.getElementById('postContent');
  const imageInput = document.getElementById('postImageUrl');
  const charCounter = document.getElementById('charCounter');
  const toggleImageBtn = document.getElementById('toggleImageInputBtn');
  const urlBar = document.getElementById('composerUrlBar');
  const previewBox = document.getElementById('composerPreview');
  const previewImg = document.getElementById('composerPreviewImg');
  const removePreviewBtn = document.getElementById('removePreviewBtn');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Character counter listener
  if (contentInput && charCounter) {
    contentInput.addEventListener('input', () => {
      const remaining = 280 - contentInput.value.length;
      charCounter.textContent = remaining;
      charCounter.classList.remove('warning', 'danger');
      if (remaining <= 20 && remaining > 0) {
        charCounter.classList.add('warning');
      } else if (remaining <= 0) {
        charCounter.classList.add('danger');
      }
    });
  }

  // Toggle URL input bar
  if (toggleImageBtn && urlBar) {
    toggleImageBtn.addEventListener('click', () => {
      urlBar.classList.toggle('hidden');
      if (!urlBar.classList.contains('hidden') && imageInput) {
        imageInput.focus();
      }
    });
  }

  // Live image preview
  if (imageInput && previewBox && previewImg) {
    imageInput.addEventListener('input', () => {
      const url = imageInput.value.trim();
      if (url.startsWith('http')) {
        previewImg.src = url;
        previewBox.style.display = 'block';
      } else {
        previewBox.style.display = 'none';
      }
    });
  }

  if (removePreviewBtn) {
    removePreviewBtn.addEventListener('click', () => {
      if (imageInput) imageInput.value = '';
      if (previewBox) previewBox.style.display = 'none';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = contentInput.value.trim();
    const imageUrl = imageInput ? imageInput.value.trim() : '';

    if (!content) return;

    try {
      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Posting...';
      const res = await API.createPost(content, imageUrl);
      
      contentInput.value = '';
      if (charCounter) charCounter.textContent = '280';
      if (imageInput) imageInput.value = '';
      if (previewBox) previewBox.style.display = 'none';
      if (urlBar) urlBar.classList.add('hidden');

      prependPostToFeed(res.post);
    } catch (err) {
      alert(err.message || 'Error creating post.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Publish';
    }
  });
}

async function loadFeed() {
  const feedContainer = document.getElementById('feedPosts');
  if (!feedContainer) return;

  feedContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Curating your feed...</p>
    </div>
  `;

  try {
    const data = await API.getFeed(currentFilter);
    const posts = data.posts || [];

    if (posts.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🪐</div>
          <h3 style="color:#fff; margin-bottom:0.4rem;">No posts yet</h3>
          <p>${currentFilter === 'following' ? "You aren't following anyone with posts yet." : 'Be the first to share something with the community!'}</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = '';
    posts.forEach(post => {
      feedContainer.appendChild(createPostCardElement(post));
    });
  } catch (err) {
    feedContainer.innerHTML = `
      <div class="error-state">
        <p>Could not load the feed. Please try again.</p>
        <button class="btn btn-outline btn-sm" style="margin-top:0.75rem;" onclick="loadFeed()">Retry</button>
      </div>
    `;
  }
}

function prependPostToFeed(post) {
  const feedContainer = document.getElementById('feedPosts');
  if (!feedContainer) return;
  const emptyState = feedContainer.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  const card = createPostCardElement(post);
  card.style.animation = 'slideDown 0.3s ease-out';
  feedContainer.insertBefore(card, feedContainer.firstChild);
}

function createPostCardElement(post) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.dataset.postId = post.id;

  const currentUser = API.getUser();
  const isAuthor = currentUser && currentUser.id === post.userId;

  const avatarMarkup = post.avatar
    ? `<img src="${post.avatar}" alt="${API.escapeHtml(post.displayName)}" class="avatar-img avatar-md">`
    : `<div class="avatar-placeholder avatar-md">${post.displayName.charAt(0).toUpperCase()}</div>`;

  const imageMarkup = post.imageUrl
    ? `<div class="post-media-box"><img src="${post.imageUrl}" alt="Media attachment" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`
    : '';

  card.innerHTML = `
    <div class="post-top-row">
      <div class="post-avatar-col">
        <a href="/profile.html?username=${encodeURIComponent(post.username)}">
          ${avatarMarkup}
        </a>
      </div>
      <div class="post-content-col">
        <div class="post-header">
          <a href="/profile.html?username=${encodeURIComponent(post.username)}" class="post-author-link">
            <span class="post-display-name">${API.escapeHtml(post.displayName)}</span>
            <span class="post-username">@${API.escapeHtml(post.username)}</span>
            <span class="post-dot-separator">·</span>
            <span class="post-time">${API.timeAgo(post.createdAt)}</span>
          </a>
          ${isAuthor ? `
            <button class="post-options-btn delete-post-btn" title="Delete post">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          ` : ''}
        </div>

        <div class="post-body-text">${API.escapeHtml(post.content)}</div>
        ${imageMarkup}

        <div class="post-action-bar">
          <!-- Like Button -->
          <button class="action-pill-btn like-btn ${post.hasLiked ? 'liked' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${post.hasLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <span class="likes-count">${post.likesCount || 0}</span>
          </button>

          <!-- Comment Button -->
          <button class="action-pill-btn comment-toggle-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            <span class="comments-count">${post.commentsCount || 0}</span>
          </button>

          <!-- Share Button -->
          <button class="action-pill-btn share-btn" title="Copy link">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          </button>
        </div>

        <!-- Comments Drawer -->
        <div class="comments-drawer hidden">
          <div class="comments-list"></div>
          ${currentUser ? `
            <form class="add-comment-form">
              <input type="text" placeholder="Post your reply..." class="comment-input" required />
              <button type="submit" class="btn btn-primary btn-sm">Reply</button>
            </form>
          ` : `
            <div class="comments-login-prompt">
              <a href="/login.html">Log in</a> to join the discussion.
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  // Like Toggle
  const likeBtn = card.querySelector('.like-btn');
  likeBtn.addEventListener('click', async () => {
    if (!API.getUser()) {
      alert('Please log in to like posts.');
      return;
    }
    try {
      const res = await API.toggleLike(post.id);
      const likesCountSpan = card.querySelector('.likes-count');
      likesCountSpan.textContent = res.likesCount;
      if (res.liked) {
        likeBtn.classList.add('liked');
        likeBtn.querySelector('svg').setAttribute('fill', 'currentColor');
      } else {
        likeBtn.classList.remove('liked');
        likeBtn.querySelector('svg').setAttribute('fill', 'none');
      }
    } catch (e) {
      console.error('Like toggle error:', e);
    }
  });

  // Share Copy Link
  const shareBtn = card.querySelector('.share-btn');
  shareBtn.addEventListener('click', () => {
    const postUrl = `${window.location.origin}/profile.html?username=${encodeURIComponent(post.username)}`;
    navigator.clipboard?.writeText(postUrl);
    alert('Link copied to clipboard!');
  });

  // Delete Post
  const deleteBtn = card.querySelector('.delete-post-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Delete this post permanently?')) {
        try {
          await API.deletePost(post.id);
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          card.style.transition = 'all 0.2s ease-out';
          setTimeout(() => card.remove(), 200);
        } catch (e) {
          alert(e.message || 'Failed to delete post.');
        }
      }
    });
  }

  // Comments Drawer
  const commentToggleBtn = card.querySelector('.comment-toggle-btn');
  const commentsDrawer = card.querySelector('.comments-drawer');
  let commentsLoaded = false;

  commentToggleBtn.addEventListener('click', async () => {
    const isHidden = commentsDrawer.classList.contains('hidden');
    if (isHidden) {
      commentsDrawer.classList.remove('hidden');
      if (!commentsLoaded) {
        await fetchAndRenderComments(post.id, card);
        commentsLoaded = true;
      }
    } else {
      commentsDrawer.classList.add('hidden');
    }
  });

  // Add Comment Form
  const addCommentForm = card.querySelector('.add-comment-form');
  if (addCommentForm) {
    addCommentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = addCommentForm.querySelector('.comment-input');
      const content = input.value.trim();
      if (!content) return;

      try {
        const res = await API.addComment(post.id, content);
        input.value = '';
        appendComment(res.comment, card, post.id);
        const countSpan = card.querySelector('.comments-count');
        countSpan.textContent = parseInt(countSpan.textContent, 10) + 1;
      } catch (err) {
        alert(err.message || 'Error posting reply.');
      }
    });
  }

  return card;
}

async function fetchAndRenderComments(postId, postCard) {
  const listEl = postCard.querySelector('.comments-list');
  listEl.innerHTML = '<div class="spinner-small"></div>';

  try {
    const res = await API.getComments(postId);
    const comments = res.comments || [];
    listEl.innerHTML = '';

    if (comments.length === 0) {
      listEl.innerHTML = '<p class="no-comments">No replies yet. Start the conversation!</p>';
      return;
    }

    comments.forEach(comment => {
      listEl.appendChild(createCommentElement(comment, postCard, postId));
    });
  } catch (e) {
    listEl.innerHTML = '<p class="no-comments">Failed to load replies.</p>';
  }
}

function appendComment(comment, postCard, postId) {
  const listEl = postCard.querySelector('.comments-list');
  const noComments = listEl.querySelector('.no-comments');
  if (noComments) noComments.remove();

  listEl.appendChild(createCommentElement(comment, postCard, postId));
}

function createCommentElement(comment, postCard, postId) {
  const commentEl = document.createElement('div');
  commentEl.className = 'comment-item';
  commentEl.dataset.commentId = comment.id;

  const currentUser = API.getUser();
  const isAuthor = currentUser && currentUser.id === comment.userId;

  const avatar = comment.avatar
    ? `<img src="${comment.avatar}" alt="${API.escapeHtml(comment.displayName)}" class="avatar-img avatar-xs">`
    : `<div class="avatar-placeholder avatar-xs">${comment.displayName.charAt(0).toUpperCase()}</div>`;

  commentEl.innerHTML = `
    ${avatar}
    <div class="comment-content-box">
      <div class="comment-header">
        <div>
          <a href="/profile.html?username=${encodeURIComponent(comment.username)}" class="comment-author-name">
            ${API.escapeHtml(comment.displayName)}
          </a>
          <span class="comment-time">${API.timeAgo(comment.createdAt)}</span>
        </div>
        ${isAuthor ? `
          <button class="delete-comment-btn" title="Delete reply">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        ` : ''}
      </div>
      <p class="comment-text">${API.escapeHtml(comment.content)}</p>
    </div>
  `;

  if (isAuthor) {
    const delBtn = commentEl.querySelector('.delete-comment-btn');
    delBtn.addEventListener('click', async () => {
      if (confirm('Delete this reply?')) {
        try {
          await API.deleteComment(comment.id);
          commentEl.remove();
          const countSpan = postCard.querySelector('.comments-count');
          countSpan.textContent = Math.max(0, parseInt(countSpan.textContent, 10) - 1);
        } catch (e) {
          alert(e.message || 'Could not delete reply.');
        }
      }
    });
  }

  return commentEl;
}
