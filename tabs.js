const PAGE_TITLES = {
  status: 'Hunter Protocol',
  quest: 'Daily Quest',
  archive: 'Hunter Archive',
  data: 'Player Data'
};

function switchTab(tabName){
  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.dataset.view === tabName);
  });

  document.querySelectorAll('.bottom-nav button').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });

  const title = document.getElementById('pageTitle');
  if(title) title.textContent = PAGE_TITLES[tabName] || 'Hunter Protocol';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.bottom-nav button[data-tab]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      switchTab(button.dataset.tab);
    });
  });
});
