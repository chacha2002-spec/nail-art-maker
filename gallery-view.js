(function () {
  'use strict';
  const dialog = document.getElementById('art-dialog');
  if (!dialog) return;
  const title = document.getElementById('art-title');
  const image = document.getElementById('art-image');
  const caption = document.getElementById('art-caption');
  const edit = document.getElementById('art-edit');
  let trigger = null;
  document.querySelectorAll('[data-gallery-image]').forEach(button => {
    button.addEventListener('click', () => {
      trigger = button;
      title.textContent = button.dataset.title;
      image.src = button.dataset.galleryImage;
      image.alt = button.dataset.title;
      caption.textContent = button.dataset.caption || '';
      const link = button.closest('article').querySelector('.gallery-edit');
      edit.href = link.href;
      dialog.showModal();
    });
  });
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if (trigger) trigger.focus(); });
}());
