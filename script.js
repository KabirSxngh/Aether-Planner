document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const plannerTitle = document.getElementById('planner-title');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const generateBtn = document.getElementById('generate-btn');
    const calendarContainer = document.getElementById('calendar-container');
    const tagList = document.getElementById('tag-list');
    const newTagNameInput = document.getElementById('new-tag-name');
    const newTagColorInput = document.getElementById('new-tag-color');
    const addTagBtn = document.getElementById('add-tag-btn');
    const modal = document.getElementById('tag-modal');
    const customTagInput = document.getElementById('custom-tag-input');
    const saveTagBtn = document.getElementById('save-tag-btn');
    const cancelTagBtn = document.getElementById('cancel-tag-btn');
    const lightThemeBtn = document.getElementById('light-theme-btn');
    const darkThemeBtn = document.getElementById('dark-theme-btn');
    const downloadBtn = document.getElementById('download-btn');
    const counterBar = document.getElementById('counter-bar');
    const counterToggle = document.getElementById('counter-toggle');
    const gridSizeSlider = document.getElementById('grid-size-slider');
    const gridSizeValue = document.getElementById('grid-size-value');
    const welcomeModal = document.getElementById('welcome-modal');
    const closeWelcomeBtn = document.getElementById('close-welcome-btn');
    const resetBtn = document.getElementById('reset-btn');
    const infoBtn = document.getElementById('info-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutBtn = document.getElementById('close-about-btn');
    const themeSwatchesContainer = document.getElementById('theme-swatches');
    const themeColorMeta = document.getElementById('theme-color-meta');

    // State
    let tags = [];
    let dateData = {};
    let longPressTimer;
    let isLongPress = false;
    let targetCell = null;
    let titleClickCount = 0;
    let titleClickTimer = null;
    const themes = [
        { name: 'Aether', gradient: 'linear-gradient(to right top, rgb(109, 80, 160), rgb(125, 89, 179))', accent: 'rgb(142, 98, 198)', primary: 'rgb(109, 80, 160)' },
        { name: 'Midnight', gradient: 'linear-gradient(to right, rgb(15, 32, 39), rgb(32, 58, 67), rgb(44, 83, 100))', accent: '#149E92', primary: '#0f2027' },
        { name: 'Sunset', gradient: 'linear-gradient(to right, rgb(255, 81, 47), rgb(221, 36, 118))', accent: '#ffcd3c', primary: '#ff512f' },
        { name: 'Ocean', gradient: 'linear-gradient(to right, rgb(0, 90, 167), rgb(255, 253, 228))', accent: '#005aa7', primary: '#005aa7' }
    ];

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    function init() {
        renderThemes();
        loadState();
        setDefaultDates();
        renderTags();
        bindEvents();
        generateCalendar();
    }
    
    function renderThemes() { themes.forEach((theme, index) => { const swatch = document.createElement('button'); swatch.className = 'theme-swatch'; swatch.title = theme.name; swatch.style.background = theme.gradient; swatch.dataset.themeIndex = index; themeSwatchesContainer.appendChild(swatch); }); }
    function bindEvents() {
        closeWelcomeBtn.addEventListener('click', () => { welcomeModal.classList.add('hidden'); localStorage.setItem('aetherPlanner_welcomed', 'true'); });
        infoBtn.addEventListener('click', () => welcomeModal.classList.remove('hidden'));
        resetBtn.addEventListener('click', () => { if (confirm("Are you sure you want to reset all data?")) { localStorage.clear(); location.reload(); } });
        tagList.addEventListener('click', handleTagListClick);
        tagList.addEventListener('input', handleTagColorChange);
        settingsToggle.addEventListener('click', () => settingsPanel.classList.toggle('show')); 
        generateBtn.addEventListener('click', generateCalendar); 
        addTagBtn.addEventListener('click', addTag); 
        lightThemeBtn.addEventListener('click', () => applyRandomTheme('light'));
        darkThemeBtn.addEventListener('click', () => applyRandomTheme('dark'));
        downloadBtn.addEventListener('click', downloadCalendar); 
        counterToggle.addEventListener('change', () => { updateCounterVisibility(); saveState(); }); 
        gridSizeSlider.addEventListener('input', (e) => { const columns = e.target.value; gridSizeValue.textContent = columns; calendarContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`; }); 
        gridSizeSlider.addEventListener('change', saveState); 
        calendarContainer.addEventListener('click', handleDateClick); 
        calendarContainer.addEventListener('mousedown', handleDateMouseDown); 
        calendarContainer.addEventListener('mouseup', handleDateMouseUp); 
        calendarContainer.addEventListener('mouseleave', handleDateMouseUp); 
        calendarContainer.addEventListener('touchstart', handleDateMouseDown, { passive: true }); 
        calendarContainer.addEventListener('touchend', handleDateMouseUp); 
        calendarContainer.addEventListener('contextmenu', e => e.preventDefault()); 
        saveTagBtn.addEventListener('click', saveCustomTag); 
        cancelTagBtn.addEventListener('click', () => modal.classList.add('hidden')); 
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
        plannerTitle.addEventListener('click', handleTitleClick);
        closeAboutBtn.addEventListener('click', () => aboutModal.classList.add('hidden'));
        aboutModal.addEventListener('click', e => { if (e.target === aboutModal) aboutModal.classList.add('hidden'); });
        themeSwatchesContainer.addEventListener('click', e => { if (e.target.classList.contains('theme-swatch')) { const themeIndex = e.target.dataset.themeIndex; const selectedTheme = themes[themeIndex]; if (selectedTheme) { applyTheme(selectedTheme); } } });
    }
    function applyTheme(theme) {
        document.documentElement.style.setProperty('--bg-gradient', theme.gradient);
        document.documentElement.style.setProperty('--accent-color', theme.accent);
        if (themeColorMeta && theme.primary) {
            themeColorMeta.setAttribute('content', theme.primary);
        }
        updateActiveSwatch();
        saveState();
    }
    function applyRandomTheme(type = 'light') {
        const baseHue = Math.floor(Math.random() * 360);
        let theme = {};
        if (type === 'dark') {
            const darkSat = 60 + Math.floor(Math.random() * 20);
            const darkLight1 = 10 + Math.floor(Math.random() * 5);
            const darkLight2 = 15 + Math.floor(Math.random() * 5);
            const accentLight = 60 + Math.floor(Math.random() * 10);
            const color1 = `hsl(${baseHue}, ${darkSat}%, ${darkLight1}%)`;
            const color2 = `hsl(${(baseHue + 40) % 360}, ${darkSat - 10}%, ${darkLight2}%)`;
            const accent = `hsl(${(baseHue + 150) % 360}, ${darkSat + 10}%, ${accentLight}%)`;
            theme = { gradient: `linear-gradient(to right top, ${color1}, ${color2})`, accent: accent, primary: color1 };
        } else {
            const randSat = 50 + Math.floor(Math.random() * 20);
            const randLight = 55 + Math.floor(Math.random() * 10);
            const randColor1 = `hsl(${baseHue}, ${randSat}%, ${randLight}%)`;
            const randColor2 = `hsl(${(baseHue + 40) % 360}, ${randSat - 5}%, ${randLight - 10}%)`;
            const accent = `hsl(${(baseHue + 20) % 360}, ${randSat + 20}%, ${randLight + 5}%)`;
            theme = { gradient: `linear-gradient(to right top, ${randColor1}, ${randColor2})`, accent: accent, primary: randColor1 };
        }
        applyTheme(theme);
    }
    function updateActiveSwatch() { const currentGradient = getComputedStyle(document.documentElement).getPropertyValue('--bg-gradient').trim(); document.querySelectorAll('.theme-swatch').forEach(swatch => { const themeIndex = swatch.dataset.themeIndex; if (themes[themeIndex] && themes[themeIndex].gradient === currentGradient) { swatch.classList.add('active'); } else { swatch.classList.remove('active'); } }); }

    // (All other functions are unchanged)
    init();
});
