(function () {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const key = 'gv_theme';

  function applyTheme(theme) {
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    if (toggle) toggle.textContent = theme === 'light' ? '☼' : '☾';
  }

  const saved = localStorage.getItem(key);
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(saved || (prefersLight ? 'light' : 'dark'));

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isLight = root.classList.contains('light');
      const next = isLight ? 'dark' : 'light';
      localStorage.setItem(key, next);
      applyTheme(next);
    });
  }

  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Astronaut fallback: if NASA URL fails, try local assets/astronaut.glb
  const astronautMV = document.getElementById('astronautMV');
  if (astronautMV) {
    astronautMV.addEventListener('error', () => {
      // Try well-known sample asset, then local fallback
      if (!astronautMV.dataset.fallback) {
        astronautMV.dataset.fallback = 'modelviewer';
        astronautMV.src = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
      } else if (astronautMV.dataset.fallback === 'modelviewer') {
        astronautMV.dataset.fallback = 'local';
        astronautMV.src = 'assets/astronaut.glb';
      }
    }, { once: false });
  }

  // --- Code area (Split View + language selector) ---
  const codeCanvas = document.getElementById('codeCanvas');
  const codeOutput = document.getElementById('codeOutput');
  const langSelect = document.getElementById('langSelect');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function highlight(line) {
    const escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const pattern = /(\/\/.*$)|("([^"\\]|\\.)*")|\b(using|class|static|void|new|return|var|public)\b|\b(Console|Program|String|int|bool|DateTime|WebApplication)\b|\b(WriteLine|Main|MapGet|Run|CreateBuilder)\b|\b\d+(?:\.\d+)?\b/gm;
    return escaped.replace(pattern, (match, gComm, gStr, _s, gKw, gType, gFn) => {
      if (gComm) return `<span class="tok-comm">${gComm}</span>`;
      if (gStr) return `<span class="tok-str">${gStr}</span>`;
      if (gKw) return `<span class="tok-kw">${gKw}</span>`;
      if (gType) return `<span class="tok-type">${gType}</span>`;
      if (gFn) return `<span class="tok-fn">${gFn}</span>`;
      if (/^\d/.test(match)) return `<span class="tok-num">${match}</span>`;
      return match;
    });
  }

  function typeLines(lines, options = {}) {
    if (!codeCanvas) return Promise.resolve();
    const speed = options.speed ?? 22;
    const pauseLine = options.pauseLine ?? 350;
    const once = options.once ?? false;

    if (reduceMotion) {
      codeCanvas.innerHTML = lines.map(highlight).join('\n');
      return Promise.resolve();
    }

    let lineIdx = 0;
    let charIdx = 0;
    let buffer = '';

    function renderCaret() {
      const html = buffer.split('\n').map(highlight).join('\n');
      codeCanvas.innerHTML = html + '<span class="caret"></span>';
    }

    return new Promise(resolve => {
      function typeNext() {
        const current = lines[lineIdx] ?? '';
        if (charIdx <= current.length) {
          buffer += current[charIdx] || '';
          charIdx += 1;
          renderCaret();
          setTimeout(typeNext, speed);
        } else {
          buffer += '\n';
          renderCaret();
          lineIdx += 1;
          charIdx = 0;
          if (lineIdx < lines.length) {
            setTimeout(typeNext, pauseLine);
          } else {
            if (once) { resolve(); return; }
            resolve();
          }
        }
      }
      typeNext();
    });
  }

  function clearUI() {
    if (codeCanvas) { codeCanvas.innerHTML = ''; }
    if (codeOutput) { codeOutput.hidden = true; codeOutput.textContent = ''; }
    const typingRoot = document.querySelector('.code-typing');
    if (typingRoot) typingRoot.classList.remove('split');
  }

  const snippets = {
    csharp: [ 'using System;', '', 'Console.WriteLine("Hello, World!");' ],
    java: [ 'public class Main {', '  public static void main(String[] args) {', '    System.out.println("Hello, World!");', '  }', '}' ],
    javascript: [ 'function hello(name) {', '  console.log(`Hello, ${name}!`);', '}', 'hello("World");' ],
    python: [ 'def hello(name):', '    print(f"Hello, {name}!")', '', 'hello("World")' ],
    sql: [ '-- Hello World via select', 'SELECT "Hello, World!" AS greeting;' ],
  };

  async function runSplitFor(langKey) {
    clearUI();
    const typingRoot = document.querySelector('.code-typing');
    if (typingRoot) typingRoot.classList.add('split');
    if (codeOutput) { codeOutput.hidden = false; codeOutput.textContent = 'Output:\n'; }
    const lines = snippets[langKey] || snippets.csharp;
    await typeLines(lines, { once: true });
    const outputs = { csharp: 'Hello, World!', java: 'Hello, World!', javascript: 'Hello, World!', python: 'Hello, World!', sql: 'greeting\nHello, World!' };
    if (codeOutput) codeOutput.textContent += outputs[langKey] || 'Hello, World!';
  }

  runSplitFor('csharp');
  if (langSelect) langSelect.addEventListener('change', (e) => runSplitFor(e.target.value));

  // --- Music Player ---
  const musicToggle = document.getElementById('musicToggle');
  const backgroundMusic = document.getElementById('backgroundMusic');
  
  if (musicToggle && backgroundMusic) {
    // Set volume to 50%
    backgroundMusic.volume = 0.5;
    
    // Check if music is currently playing
    function updateButtonState() {
      const icon = musicToggle.querySelector('.music-icon');
      if (!backgroundMusic.paused && !backgroundMusic.ended) {
        if (icon) {
          icon.textContent = '||';
          icon.classList.remove('play-icon');
          icon.classList.add('pause-icon');
        }
        musicToggle.classList.add('playing');
      } else {
        if (icon) {
          icon.textContent = '';
          icon.classList.remove('pause-icon');
          icon.classList.add('play-icon');
        }
        musicToggle.classList.remove('playing');
      }
    }
    
    // Initial button state
    updateButtonState();
    
    // Toggle play/pause on click
    musicToggle.addEventListener('click', () => {
      if (backgroundMusic.paused || backgroundMusic.ended) {
        // Play music
        backgroundMusic.play().then(() => {
          updateButtonState();
        }).catch((error) => {
          console.error('Error playing music:', error);
          const icon = musicToggle.querySelector('.music-icon');
          if (icon) {
            icon.textContent = '';
            icon.classList.remove('pause-icon');
            icon.classList.add('play-icon');
          }
        });
      } else {
        // Pause music
        backgroundMusic.pause();
        updateButtonState();
      }
    });
    
    // Update button when music state changes
    backgroundMusic.addEventListener('play', updateButtonState);
    backgroundMusic.addEventListener('pause', updateButtonState);
    backgroundMusic.addEventListener('ended', updateButtonState);
    
    // Handle errors
    backgroundMusic.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      const icon = musicToggle.querySelector('.music-icon');
      if (icon) {
        icon.textContent = '';
        icon.classList.remove('pause-icon');
        icon.classList.add('play-icon');
      }
      musicToggle.classList.remove('playing');
      musicToggle.style.opacity = '0.5';
      musicToggle.title = 'Erro ao carregar música';
    });
  }
})();


