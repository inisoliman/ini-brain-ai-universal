document.querySelectorAll('[data-nav-toggle]').forEach(button => {
  button.addEventListener('click', () => {
    const nav = document.querySelector('[data-nav]');
    const open = nav?.classList.toggle('open') ?? false;
    button.setAttribute('aria-expanded', String(open));
  });
});

document.querySelectorAll('pre').forEach(block => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-button';
  button.textContent = 'نسخ';
  button.setAttribute('aria-label', 'نسخ الأمر');
  button.addEventListener('click', async () => {
    const code = block.querySelector('code')?.textContent ?? block.textContent ?? '';
    await navigator.clipboard.writeText(code.replace(/^نسخ/, '').trim());
    button.textContent = 'تم ✓';
    setTimeout(() => { button.textContent = 'نسخ'; }, 1400);
  });
  block.appendChild(button);
});

document.querySelectorAll('[data-tabs]').forEach(tabGroup => {
  const buttons = [...tabGroup.querySelectorAll('[role="tab"]')];
  const panels = [...tabGroup.querySelectorAll('[role="tabpanel"]')];
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => item.setAttribute('aria-selected', String(item === button)));
    panels.forEach(panel => { panel.hidden = panel.id !== button.getAttribute('aria-controls'); });
  }));
});

