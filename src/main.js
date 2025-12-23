import './style.css'

// State
const state = {
  articles: [],
  videos: [],
  currentArticle: null,
  token: (() => {
    const t = localStorage.getItem('yedibe_token');
    return (t && t !== 'null' && t !== 'undefined') ? t : null;
  })(),
  view: 'home', // home, login, dashboard, articles, videos, article
  filter: {
    category: 'All',
    search: ''
  }
};

// Config
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const app = document.querySelector('#app');

// YouTube player management (must be global for cross-module access)
window.youtubePlayers = [];
let youtubeAPIReady = false;

// Load YouTube IFrame API
if (!window.YT) {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// YouTube API ready callback
window.onYouTubeIframeAPIReady = () => {
  youtubeAPIReady = true;
  console.log('YouTube IFrame API is ready');
};

// --- RENDER FUNCTIONS ---

function renderHeader() {
  const getActiveClass = (view) => state.view === view ? 'active' : '';

  return `
  <header class="app-header">
    <a href="#" onclick="window.navigate('home')" class="logo-container">
      <h1 class="logo">YEDIBE</h1>
      <div class="tagline">Truth in South African Media</div>
    </a>
    <button class="hamburger" aria-label="Toggle menu" onclick="window.toggleMenu()">
      <span></span>
      <span></span>
      <span></span>
    </button>
    <nav class="nav-links" id="nav-links">
      <a href="#" onclick="window.navigate('home'); window.toggleMenu(false)" class="nav-link ${getActiveClass('home')}">Home</a>
      <a href="#" onclick="window.navigate('articles'); window.toggleMenu(false)" class="nav-link ${getActiveClass('articles')}">Articles</a>
      <a href="#" onclick="window.navigate('videos'); window.toggleMenu(false)" class="nav-link ${getActiveClass('videos')}">Videos</a>
      <a href="#" class="nav-link" onclick="window.toggleMenu(false)">About Us</a>
      <a href="#" class="nav-link" onclick="window.toggleMenu(false)">Contact</a>
      ${state.token ?
      `<a href="#" onclick="window.navigate('dashboard'); window.toggleMenu(false)" class="nav-link" style="color:var(--color-primary)">Dashboard</a>
         <a href="#" onclick="window.logout(); window.toggleMenu(false)" class="nav-link">Logout</a>` :
      ``
    }
    </nav>
  </header>
  `;
}

function renderHome() {
  // Show only last 3 items for home
  const recentArticles = state.articles.slice(0, 3);
  const recentVideos = state.videos.slice(0, 2);

  // Category icons as SVG
  const categoryIcons = {
    politics: `<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
    economy: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
    culture: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  };

  // Sample category images (using placeholder Renaissance art style backgrounds)
  const categoryCards = [
    { name: 'Latest Political Analysis', icon: categoryIcons.politics, filter: 'Politics', color: '#3a2a15' },
    { name: 'Economic Trends', icon: categoryIcons.economy, filter: 'Economy', color: '#2a1a10' },
    { name: 'Cultural Highlights', icon: categoryIcons.culture, filter: 'Culture', color: '#1a2a1a' }
  ];

  return `
    ${renderHeader()}
  <main>
    <div class="hero-section">
      <h1 class="hero-title"><span class="gold-text">YEDIBE.</span> Informing South Africa.</h1>
      <p class="hero-subtitle">Independent Journalism for a Better Future...</p>
      <a href="#" onclick="window.navigate('articles')" class="btn-hero">Explore Our Stories</a>
    </div>

    <section class="categories-section">
      <div class="container">
        <div class="categories-grid">
          ${categoryCards.map((cat, index) => `
            <div class="category-card" onclick="window.navigateToCategory('${cat.filter}')" style="background-color: ${cat.color}">
              ${recentArticles[index]?.imageUrl ?
      `<img src="${recentArticles[index].imageUrl}" alt="${cat.name}">` :
      `<div style="width:100%;height:100%;background:linear-gradient(135deg, ${cat.color} 0%, #1a1a1a 100%);"></div>`
    }
              <div class="category-card-content">
                <div class="category-icon">${cat.icon}</div>
                <h3 class="category-card-title">${cat.name}</h3>
              </div>
            </div>
          `).join('')}
          
          <div class="videos-sidebar">
            <h3 class="videos-sidebar-title">Videos & Documentaries</h3>
            <div class="video-thumbnails">
              ${recentVideos.length ? recentVideos.map(video => `
                <div class="video-thumb" onclick="window.navigate('videos')">
                  ${video.thumbnailUrl ?
        `<img src="${video.thumbnailUrl}" alt="${video.title}">` :
        `<div style="width:100%;height:100%;background:#333;"></div>`
      }
                  <div class="video-thumb-play">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                  <span class="video-thumb-label">Videos</span>
                </div>
              `).join('') : `
                <div class="video-thumb" onclick="window.navigate('videos')">
                  <div style="width:100%;height:100%;background:#333;"></div>
                  <div class="video-thumb-play">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                  <span class="video-thumb-label">Videos</span>
                </div>
                <div class="video-thumb" onclick="window.navigate('videos')">
                  <div style="width:100%;height:100%;background:#333;"></div>
                  <div class="video-thumb-play">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                  <span class="video-thumb-label">Videos</span>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="container" style="margin-top: 60px;">
      <section>
        <div class="section-title">Latest Releases</div>
        <div class="news-grid">
          ${recentArticles.length ? recentArticles.map(renderArticleCard).join('') : '<p style="text-align:center; grid-column:1/-1; color: var(--color-text-muted);">No articles yet.</p>'}
        </div>
      </section>

      <section style="margin-top: 60px; margin-bottom: 60px;">
        <div class="section-title">Multimedia Reports</div>
        <div class="news-grid">
          ${recentVideos.length ? recentVideos.map(renderVideoCard).join('') : '<p style="text-align:center; grid-column:1/-1; color: var(--color-text-muted);">No videos yet.</p>'}
        </div>
      </section>
    </div>
  </main>
  ${renderFooter()}
  `;
}

function renderArticles() {
  const categories = ['All', 'Politics', 'Culture', 'Economy', 'Society', 'Education', 'Faith'];

  // Filter logic
  let filtered = state.articles.filter(a => {
    const matchesCategory = state.filter.category === 'All' || a.category === state.filter.category;
    const matchesSearch = a.title.toLowerCase().includes(state.filter.search.toLowerCase()) ||
      a.content.toLowerCase().includes(state.filter.search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return `
    ${renderHeader()}
  <main>
    <div class="page-header">
      <div class="container">
        <h1 class="page-title" style="font-family:var(--font-gothic); margin:0;">Articles & Essays</h1>
        <p style="margin-top:8px; font-style:italic;">Conservative perspectives on South African politics, culture, and society</p>

        <div class="filter-bar">
          <div class="filter-group">
            <span class="filter-label">Categories</span>
            ${categories.map(cat => `
                <div class="pill ${state.filter.category === cat ? 'active' : ''}" 
                     onclick="window.setFilter('category', '${cat}')">${cat}</div>
              `).join('')}
          </div>
          <div class="search-container">
            <input type="text" class="search-input" placeholder="Search articles..."
              value="${state.filter.search}"
              oninput="window.setFilter('search', this.value)">
              <button class="search-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></button>
          </div>
        </div>
      </div>
    </div>

    <div class="container" style="margin-bottom:80px;">
      <div class="news-grid">
        ${filtered.length ? filtered.map(renderArticleCard).join('') : '<p style="text-align:center; grid-column:1/-1; padding:40px;">No articles found matching your criteria.</p>'}
      </div>
    </div>
  </main>
  ${renderFooter()}
  `;
}

function renderVideos() {
  const categories = ['All', 'Politics', 'Culture', 'Economy', 'Society', 'Education', 'Faith'];

  // Filter logic
  let filtered = state.videos.filter(v => {
    const matchesCategory = state.filter.category === 'All' || (v.category || 'General') === state.filter.category;
    const matchesSearch = v.title.toLowerCase().includes(state.filter.search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return `
     ${renderHeader()}
  <main>
    <div class="page-header">
      <div class="container">
        <h1 class="page-title" style="font-family:var(--font-gothic); margin:0;">Videos & Documentaries</h1>
        <p style="margin-top:8px; font-style:italic;">In-depth reports and interviews</p>

        <div class="filter-bar">
          <div class="filter-group">
            <span class="filter-label">Categories</span>
            ${categories.map(cat => `
                <div class="pill ${state.filter.category === cat ? 'active' : ''}" 
                     onclick="window.setFilter('category', '${cat}')">${cat}</div>
              `).join('')}
          </div>
          <div class="search-container">
            <input type="text" class="search-input" placeholder="Search videos..."
              value="${state.filter.search}"
              oninput="window.setFilter('search', this.value)">
              <button class="search-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></button>
          </div>
        </div>
      </div>
    </div>

    <div class="container" style="margin-bottom:80px;">
      <div class="news-grid">
        ${filtered.length ? filtered.map(renderVideoCard).join('') : '<p style="text-align:center; grid-column:1/-1; padding:40px;">No videos found.</p>'}
      </div>
    </div>
  </main>
  ${renderFooter()}
  `;
}

function renderArticleCard(article) {
  return `
    <article class="card article-card">
      ${article.imageUrl ?
      `<div class="card-img-container">
          <img src="${article.imageUrl}" alt="${article.title}">
        </div>` :
      `<div class="card-img-container" style="background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);"></div>`
    }
      <div class="card-content">
        <span class="card-category">${article.category}</span>
        <h3 class="card-title">${article.title}</h3>
        <p class="card-excerpt">${article.content.substring(0, 150)}...</p>
        <button class="btn-read-more" onclick="window.viewArticle('${article.id}')">Read More</button>
      </div>
    </article>
  `;
}

function renderVideoCard(video) {
  // Extract YouTube video ID from URL
  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : '';
  };

  const videoId = getYouTubeId(video.youtubeUrl || '');

  return `
    <div class="card video-card">
      <div class="card-img-container" style="position: relative;">
        ${video.thumbnailUrl ?
      `<img src="${video.thumbnailUrl}" alt="${video.title}" style="cursor: pointer;" onclick="window.playYouTubeVideo('${videoId}', this.parentElement)">
           <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 68px; height: 48px; background: red; border-radius: 12px; cursor: pointer; pointer-events: none;">
             <svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"></path><path d="M 45,24 27,14 27,34" fill="#fff"></path></svg>
           </div>`
      : `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    }
      </div>
      <div class="card-content">
        <span class="card-category">${video.category || 'General'}</span>
        <h3 class="card-title" style="font-size:1.1rem">${video.title}</h3>
        <div class="card-meta">
          <span>${new Date(video.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  `;
}

// Helper function to pause all active YouTube videos (must be global)
window.pauseAllVideos = () => {
  // Use reverse iteration to safely remove destroyed players
  for (let i = window.youtubePlayers.length - 1; i >= 0; i--) {
    const player = window.youtubePlayers[i];
    try {
      if (player && typeof player.pauseVideo === 'function') {
        const state = player.getPlayerState();
        // Pause if playing (state 1) or buffering (state 3)
        if (state === 1 || state === 3) {
          player.pauseVideo();
        }
      }
    } catch (e) {
      // Player might be destroyed, remove from array
      window.youtubePlayers.splice(i, 1);
    }
  }
};

// Helper function to replace thumbnail with YouTube player
window.playYouTubeVideo = (videoId, container) => {
  // Pause all currently playing videos first
  window.pauseAllVideos();

  // Create a unique ID for this player
  const playerId = `youtube-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Clear container and add div for player
  container.innerHTML = `<div id="${playerId}" style="width:100%;height:100%;"></div>`;

  // Wait for API to be ready, then create player
  const createPlayer = () => {
    if (window.YT && window.YT.Player) {
      const player = new YT.Player(playerId, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onStateChange: (event) => {
            // When this video starts playing, pause all others
            if (event.data === YT.PlayerState.PLAYING) {
              window.youtubePlayers.forEach(p => {
                if (p !== player) {
                  try {
                    if (p.getPlayerState() === YT.PlayerState.PLAYING) {
                      p.pauseVideo();
                    }
                  } catch (e) {
                    // Player might be destroyed
                  }
                }
              });
            }
          }
        }
      });

      // Add to players array
      window.youtubePlayers.push(player);

      // Cleanup: remove old/destroyed players
      setTimeout(() => {
        for (let i = window.youtubePlayers.length - 1; i >= 0; i--) {
          try {
            window.youtubePlayers[i].getPlayerState();
          } catch (e) {
            window.youtubePlayers.splice(i, 1);
          }
        }
      }, 100);
    } else {
      // API not ready yet, wait and try again
      setTimeout(createPlayer, 100);
    }
  };

  createPlayer();
};

// Single article view
function renderSingleArticle() {
  if (!state.currentArticle) {
    window.navigate('articles');
    return '';
  }

  const article = state.currentArticle;
  return `
    ${renderHeader()}
    <main>
      <div class="article-page-container">
        <div class="article-page-header">
          <div class="container" style="max-width: 900px;">
            <a href="#" onclick="window.navigate('articles')" class="back-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Articles
            </a>
          </div>
        </div>
        
        ${article.imageUrl ?
      `<div class="article-featured-image">
            <img src="${article.imageUrl}" alt="${article.title}">
          </div>` : ''
    }
        
        <div class="container" style="max-width: 900px;">
          <article class="single-article">
            <span class="card-category">${article.category}</span>
            <h1 class="article-page-title">${article.title}</h1>
            <div class="article-page-meta">
              <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>${article.author}</span>
              </div>
              <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>${new Date(article.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
            <div class="article-page-content">
              ${article.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
            </div>
          </article>
        </div>
      </div>
    </main>
    ${renderFooter()}
  `;
}

function renderFooter() {
  return `
  <footer class="app-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col about-col">
          <a href="#" onclick="window.navigate('home')" class="logo-container">
            <h2 class="logo">YEDIBE</h2>
            <div class="tagline">Truth in South African Media</div>
          </a>
          <p class="footer-about-text">
            Dedicated to providing independent, investigative journalism with a focus on South African politics, culture, and society.
          </p>
          <div class="social-links">
            <a href="#" class="social-link" aria-label="X (Twitter)">
              <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" class="social-link" aria-label="Facebook">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" class="social-link" aria-label="YouTube">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2.04C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2.04C1 8.14 1 12 1 12s0 3.86.46 5.58a2.78 2.78 0 0 0 1.94 2.04c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2.04c.46-1.72.46-5.58.46-5.58s0-3.86-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
            </a>
          </div>
        </div>
        
        <div class="footer-col">
          <h3>Quick Links</h3>
          <ul class="footer-links">
            <li><a href="#" onclick="window.navigate('home')">Home</a></li>
            <li><a href="#" onclick="window.navigate('articles')">Articles</a></li>
            <li><a href="#" onclick="window.navigate('videos')">Videos</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        
        <div class="footer-col">
          <h3>Categories</h3>
          <ul class="footer-links">
            <li><a href="#" onclick="window.navigateToCategory('Politics')">Politics</a></li>
            <li><a href="#" onclick="window.navigateToCategory('Economy')">Economy</a></li>
            <li><a href="#" onclick="window.navigateToCategory('Culture')">Culture</a></li>
            <li><a href="#" onclick="window.navigateToCategory('Faith')">Faith</a></li>
          </ul>
        </div>
        
        <div class="footer-col newsletter-col">
          <h3>Newsletter</h3>
          <p>Join our mailing list for weekly insights.</p>
          <form class="footer-newsletter-form" onsubmit="event.preventDefault(); alert('Subscribed!')">
            <input type="email" placeholder="Email address" required>
            <button type="submit">Join</button>
          </form>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Yedibe. All rights reserved.</p>
        <div class="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
  `;
}
function renderLogin() {
  return `
    ${renderHeader()}
  <div class="auth-container">
    <h2 style="text-align:center; margin-bottom:1.5rem;">Admin Access</h2>
    <form id="login-form">
      <div class="form-group">
        <label>Username</label>
        <input type="text" name="username" required>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" required>
      </div>
      <button type="submit" class="btn" style="width:100%">Sign In</button>
    </form>
  </div>
  ${renderFooter()}
  `;
}

function renderDashboard() {
  if (!state.token) { window.navigate('login'); return ''; } // Guard
  return `
    ${renderHeader()}
  <div class="admin-container">
    <h2 style="margin-bottom:1.5rem;">Content Management</h2>

    <div class="form-tabs">
      <div class="tab active" onclick="switchTab('article')" id="tab-article">Write Article</div>
      <div class="tab" onclick="switchTab('video')" id="tab-video">Upload Video</div>
      <div class="tab" onclick="switchTab('manage')" id="tab-manage">Manage Content</div>
    </div>

    <!-- Article Form -->
    <form id="article-form">
      <div class="form-group">
        <label>Headline</label>
        <input type="text" name="title" required placeholder="Impactful headline">
      </div>
      <div class="form-group">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
          <div>
            <label>Category</label>
            <select name="category">
              <option value="Politics">Politics</option>
              <option value="Culture">Culture</option>
              <option value="Economy">Economy</option>
              <option value="Society">Society</option>
              <option value="Education">Education</option>
              <option value="Faith">Faith</option>
            </select>
          </div>
          <div>
            <label>Author</label>
            <input type="text" name="author" value="Yedibe Staff">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>Summary</label>
        <textarea name="summary" rows="3" required placeholder="Brief summary that appears on the card..."></textarea>
      </div>
      <div class="form-group">
        <label>Header Image</label>
        <input type="file" id="article-image" accept="image/*">
      </div>
      <div class="form-group">
        <label>Content</label>
        <textarea name="content" rows="8" required placeholder="Article body..."></textarea>
      </div>
      <button type="submit" class="btn">Publish Article</button>
    </form>

    <!-- Video Form -->
    <form id="video-form" class="hidden">
      <div class="form-group">
        <label>Video Title</label>
        <input type="text" id="video-title" required>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select id="video-category">
          <option value="Politics">Politics</option>
          <option value="Culture">Culture</option>
          <option value="Economy">Economy</option>
          <option value="Society">Society</option>
          <option value="Education">Education</option>
          <option value="Faith">Faith</option>
        </select>
      </div>
      <div class="form-group">
        <label>YouTube URL</label>
        <input type="url" id="youtube-url" required placeholder="https://www.youtube.com/watch?v=...">
      </div>
      <div class="form-group">
        <label>Thumbnail Image</label>
        <input type="file" id="thumbnail-file" accept="image/*" required>
      </div>
      <div id="upload-progress" class="hidden" style="margin-bottom:1rem; background:#eee; height:8px; border-radius:4px; overflow:hidden">
        <div class="progress-fill" style="background:var(--color-primary); height:100%; width:0%"></div>
      </div>
      <button type="submit" class="btn" id="video-submit-btn">Add Video</button>
    </form>

    <!-- Manage Content Section -->
    <div id="manage-content" class="hidden">
      <h3>Articles</h3>
      <div class="content-list">
        ${state.articles.map(article => `
          <div class="content-item">
            <div class="content-info">
              <strong>${article.title}</strong>
              <span style="color:var(--color-text-muted)">${article.category} • ${new Date(article.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="content-actions">
              <button class="btn-delete" onclick="window.deleteArticle('${article.id}')">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>

      <h3 style="margin-top:2rem">Videos</h3>
      <div class="content-list">
        ${state.videos.map(video => `
          <div class="content-item">
            <div class="content-info">
              <strong>${video.title}</strong>
              <span style="color:var(--color-text-muted)">${video.category} • ${new Date(video.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="content-actions">
              <button class="btn-delete" onclick="window.deleteVideo('${video.id}')">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  ${renderFooter()}
  `;
}

// --- LOGIC ---

// Router
window.navigate = (view) => {
  state.view = view;
  // Reset filters when entering a view
  if (view === 'articles' || view === 'videos') {
    state.filter.search = '';
    state.filter.category = 'All';
  }
  updateUI();
};

window.setFilter = (key, value) => {
  state.filter[key] = value;
  updateUI();
};

window.navigateToCategory = (category) => {
  state.filter.category = category;
  state.view = 'articles';
  updateUI();
};

window.logout = () => {
  localStorage.removeItem('yedibe_token');
  state.token = null;
  window.navigate('home');
};

window.switchTab = (type) => {
  const articleForm = document.getElementById('article-form');
  const videoForm = document.getElementById('video-form');
  const manageContent = document.getElementById('manage-content');

  const tabArticle = document.getElementById('tab-article');
  const tabVideo = document.getElementById('tab-video');
  const tabManage = document.getElementById('tab-manage');

  // Hide all
  articleForm?.classList.add('hidden');
  videoForm?.classList.add('hidden');
  manageContent?.classList.add('hidden');

  tabArticle?.classList.remove('active');
  tabVideo?.classList.remove('active');
  tabManage?.classList.remove('active');

  // Show selected
  if (type === 'article') {
    articleForm?.classList.remove('hidden');
    tabArticle?.classList.add('active');
  } else if (type === 'video') {
    videoForm?.classList.remove('hidden');
    tabVideo?.classList.add('active');
  } else if (type === 'manage') {
    manageContent?.classList.remove('hidden');
    tabManage?.classList.add('active');
  }
};

// View single article
window.viewArticle = (id) => {
  state.currentArticle = state.articles.find(a => a.id === id);
  state.view = 'article';
  updateUI();
};
// Delete article
window.deleteArticle = async (id) => {
  if (!confirm('Are you sure you want to delete this article?')) return;

  try {
    const res = await fetch(`${API_URL}/articles/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');

    alert('Article deleted successfully');
    await fetchRecentData();
    updateUI();
  } catch (error) {
    console.error(error);
    alert('Failed to delete article');
  }
};

// Delete video  
window.deleteVideo = async (id) => {
  if (!confirm('Are you sure you want to delete this video?')) return;

  try {
    const res = await fetch(`${API_URL}/videos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');

    alert('Video deleted successfully');
    await fetchRecentData();
    updateUI();
  } catch (error) {
    console.error(error);
    alert('Failed to delete video');
  }
};

window.toggleMenu = (forceState) => {
  const nav = document.getElementById('nav-links');
  const hamburger = document.querySelector('.hamburger');

  if (forceState !== undefined) {
    if (forceState) {
      nav.classList.add('active');
      hamburger.classList.add('active');
    } else {
      nav.classList.remove('active');
      hamburger.classList.remove('active');
    }
  } else {
    nav.classList.toggle('active');
    hamburger.classList.toggle('active');
  }
};

function updateUI() {
  const root = app;
  if (state.view === 'home') root.innerHTML = renderHome();
  else if (state.view === 'articles') root.innerHTML = renderArticles();
  else if (state.view === 'videos') root.innerHTML = renderVideos();
  else if (state.view === 'article') root.innerHTML = renderSingleArticle();
  else if (state.view === 'login') root.innerHTML = renderLogin();
  else if (state.view === 'dashboard') root.innerHTML = renderDashboard();

  attachEvents();
}

function attachEvents() {
  // Login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(formData))
        });
        const data = await res.json();
        if (res.ok) {
          state.token = data.token;
          localStorage.setItem('yedibe_token', data.token);
          window.navigate('dashboard');
        } else {
          alert(data.error);
        }
      } catch (err) { alert('Login failed'); }
    });
  }

  // Article Post
  const articleForm = document.getElementById('article-form');
  if (articleForm) {
    articleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(articleForm).entries());
      const imageFile = document.getElementById('article-image').files[0];

      try {
        let imageUrl = '';

        // Upload image if selected
        if (imageFile) {
          const formData = new FormData();
          formData.append('file', imageFile);

          const uploadRes = await fetch(`${API_URL}/upload/article-image`, {
            method: 'POST',
            body: formData
          });

          if (!uploadRes.ok) throw new Error('Image upload failed');
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }

        // Submit article
        await fetch(`${API_URL}/articles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, imageUrl })
        });

        alert('Published!');
        articleForm.reset();
        fetchRecentData();
      } catch (e) {
        console.error(e);
        alert('Error publishing: ' + e.message);
      }
    });
  }

  // Video Upload
  const videoForm = document.getElementById('video-form');
  if (videoForm) {
    videoForm.addEventListener('submit', handleVideoUpload);
  }
}

async function handleVideoUpload(e) {
  e.preventDefault();
  const thumbnailFile = document.getElementById('thumbnail-file').files[0];
  const title = document.getElementById('video-title').value;
  const category = document.getElementById('video-category').value;
  const youtubeUrl = document.getElementById('youtube-url').value;

  if (!thumbnailFile) {
    alert('Please select a thumbnail image');
    return;
  }

  if (!youtubeUrl) {
    alert('Please provide a YouTube URL');
    return;
  }

  const btn = document.getElementById('video-submit-btn');
  const progress = document.getElementById('upload-progress');

  btn.disabled = true;
  progress.classList.remove('hidden');

  try {
    // Upload thumbnail to Supabase Storage
    const formData = new FormData();
    formData.append('file', thumbnailFile);

    const uploadRes = await fetch(`${API_URL}/upload/video-thumbnail`, {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) throw new Error('Thumbnail upload failed');
    const uploadData = await uploadRes.json();

    // Save video record with YouTube URL and thumbnail
    await fetch(`${API_URL}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        youtubeUrl,
        thumbnailUrl: uploadData.url,
        thumbnailPublicId: uploadData.path,
        category
      })
    });

    alert('Video added successfully!');
    document.getElementById('video-form').reset();
    fetchRecentData();
  } catch (err) {
    console.error(err);
    alert('Failed to add video: ' + (err.message || err));
  } finally {
    btn.disabled = false;
    progress.classList.add('hidden');
  }
}

async function fetchRecentData() {
  try {
    const [a, v] = await Promise.all([
      fetch(`${API_URL}/articles`).then(r => r.json()),
      fetch(`${API_URL}/videos`).then(r => r.json())
    ]);
    state.articles = a;
    state.videos = v;
    updateUI(); // Refresh UI after fetching new data
  } catch (e) { console.error(e); }
}

// Init
async function init() {
  // Check for secret link on load
  if (window.location.hash === '#admin') state.view = 'login';

  // Listen for manual URL changes
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') {
      state.view = 'login';
      updateUI();
    }
  });

  await fetchRecentData();
  updateUI();
}

init();
