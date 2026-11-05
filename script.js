'use strict';
// Frontend only. This simulated terminal never executes system commands.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reducedMotion) {
  document.documentElement.classList.add('js-ready');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}

// Mobile navigation.
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  mobileNav.hidden = true;
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  mobileNav.hidden = expanded;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

// Keyboard-accessible editor tabs.
const editorTabs = [...document.querySelectorAll('.editor-tab')];
function selectTab(tab) {
  editorTabs.forEach(item => {
    const selected = item === tab;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}
editorTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % editorTabs.length;
    if (event.key === 'ArrowLeft') next = (index + editorTabs.length - 1) % editorTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = editorTabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectTab(editorTabs[next]);
      editorTabs[next].focus();
    }
  });
});

// Working dashboard theme toggle. It affects only the demo, not the portfolio.
const themeToggle = document.querySelector('#theme-toggle');
const workspace = document.querySelector('#workspace-demo');
themeToggle.addEventListener('click', () => {
  const light = workspace.classList.toggle('light');
  themeToggle.setAttribute('aria-pressed', String(light));
  themeToggle.setAttribute('aria-label', `Switch workspace demo to ${light ? 'dark' : 'light'} theme`);
});

// A real selection sort, animated through DOM updates.
const barsContainer = document.querySelector('#sort-bars');
const sortButton = document.querySelector('#sort-button');
const resetButton = document.querySelector('#reset-sort');
const sortStatus = document.querySelector('#sort-status');
const startingValues = [44, 77, 29, 91, 53, 19, 68, 38, 84, 59, 25, 72];
let values = [...startingValues];
let runId = 0;
let sorting = false;
const pause = milliseconds => reducedMotion ? Promise.resolve() : new Promise(resolve => setTimeout(resolve, milliseconds));
function renderBars(active = [], sortedCount = 0) {
  const fragment = document.createDocumentFragment();
  values.forEach((value, index) => {
    const bar = document.createElement('span');
    bar.className = 'bar';
    bar.style.height = `${value}%`;
    if (index < sortedCount) bar.classList.add('sorted');
    if (active.includes(index)) bar.classList.add('comparing');
    bar.title = String(value);
    bar.setAttribute('aria-hidden', 'true');
    fragment.append(bar);
  });
  barsContainer.replaceChildren(fragment);
  barsContainer.setAttribute('aria-label', `Array values: ${values.join(', ')}`);
}
renderBars();
sortButton.addEventListener('click', async () => {
  if (sorting) return;
  sorting = true;
  sortButton.disabled = true;
  const currentRun = ++runId;
  sortStatus.textContent = 'Sorting…';
  for (let i = 0; i < values.length - 1; i++) {
    let minimum = i;
    for (let j = i + 1; j < values.length; j++) {
      if (currentRun !== runId) return;
      renderBars([minimum, j], i);
      await pause(55);
      if (currentRun !== runId) return;
      if (values[j] < values[minimum]) minimum = j;
    }
    [values[i], values[minimum]] = [values[minimum], values[i]];
    renderBars([], i + 1);
    await pause(100);
  }
  if (currentRun !== runId) return;
  renderBars([], values.length);
  sortStatus.textContent = 'Sorted ✓';
  sorting = false;
  sortButton.disabled = false;
});
resetButton.addEventListener('click', () => {
  runId++;
  sorting = false;
  values = [...startingValues];
  sortButton.disabled = false;
  sortStatus.textContent = 'Ready to run';
  renderBars();
});

// Simulated shell: explicit allowlist, plain text output, no eval or requests.
const terminalForm = document.querySelector('#terminal-form');
const terminalInput = document.querySelector('#terminal-input');
const terminalOutput = document.querySelector('#terminal-output');
const terminalBody = document.querySelector('.terminal-body');
const commandHistory = [];
let historyIndex = 0;
const responses = {
  help: 'Available commands:\n  whoami    A quick introduction\n  projects  About the live demos\n  stack     What this site runs on\n  contact   Contact status\n  clear     Clear the terminal',
  whoami: 'Albi — Programmer.\nPersonal bio and experience: to be added.',
  projects: '01  Command center — a theme-switching dashboard UI.\n02  Logic, visualized — a working selection sort.\n\nBoth were built for this preview. Real projects are still to be added.',
  stack: 'This site: HTML + CSS + vanilla JavaScript.\nAlbi’s personal languages and frameworks: not specified yet.',
  contact: 'Contact details have not been added.\nNo email address or social profile has been assumed.'
};
terminalForm.addEventListener('submit', event => {
  event.preventDefault();
  const entered = terminalInput.value.trim();
  if (!entered) return;
  const command = entered.toLowerCase();
  commandHistory.push(entered);
  historyIndex = commandHistory.length;
  terminalInput.value = '';
  if (command === 'clear') {
    terminalOutput.replaceChildren();
    return;
  }
  const entry = document.createElement('div');
  entry.className = 'terminal-entry';
  const prompt = document.createElement('div');
  prompt.className = 'terminal-command';
  prompt.textContent = `❯ ${entered}`;
  const result = document.createElement('div');
  result.className = 'terminal-result';
  if (Object.hasOwn(responses, command)) {
    result.textContent = responses[command];
  } else {
    result.classList.add('error');
    result.textContent = `Command not found: ${entered}\nType help to see the available commands.`;
  }
  entry.append(prompt, result);
  terminalOutput.append(entry);
  // Bound memory usage in a long-running browser session.
  while (terminalOutput.children.length > 35) terminalOutput.firstElementChild.remove();
  terminalBody.scrollTop = terminalBody.scrollHeight;
});
terminalInput.addEventListener('keydown', event => {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    historyIndex = Math.max(0, historyIndex - 1);
    terminalInput.value = commandHistory[historyIndex] || '';
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    historyIndex = Math.min(commandHistory.length, historyIndex + 1);
    terminalInput.value = commandHistory[historyIndex] || '';
  }
});

// Honest preview details instead of dead project links or invented contact data.
const dialog = document.querySelector('#detail-dialog');
const detailContent = {
  workspace: ['Command center', 'A frontend demo created for this portfolio. The dashboard layout is built with HTML and CSS, and its theme switch works with JavaScript. The chart and tasks are illustrative, not connected to a real account or service. Your own project, screenshots, source link, and case study can replace this demo.'],
  sort: ['Logic, visualized', 'A real selection sort running in your browser. It compares values, finds the next smallest item, and swaps it into place. The bars show the changing array. This implementation uses vanilla JavaScript and DOM updates, with no backend or animation library. It was made for this preview, not presented as a past project.'],
  contact: ['Let’s talk code.', 'Your preferred contact details will go here. No email address, GitHub profile, or LinkedIn URL has been guessed. Once you provide the links you want to share, this button can lead directly to your preferred contact method.']
};
function showDetail(key) {
  const [heading, text] = detailContent[key];
  document.querySelector('#dialog-title').textContent = heading;
  document.querySelector('#dialog-body').textContent = text;
  dialog.showModal();
  document.body.classList.add('modal-open');
}
document.querySelectorAll('[data-detail]').forEach(button => button.addEventListener('click', () => showDetail(button.dataset.detail)));
document.querySelector('#contact-button').addEventListener('click', () => showDetail('contact'));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('.dialog-done').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
