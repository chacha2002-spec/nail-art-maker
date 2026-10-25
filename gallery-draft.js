(function () {
  'use strict';
  function transfer(mode, value) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('nail-gallery-transfer', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('drafts');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction('drafts', 'readwrite'), store = tx.objectStore('drafts');
        let result = null;
        if (mode === 'save') store.put({image:value, expires:Date.now()+30*60*1000}, 'pending');
        else {
          const read = store.get('pending');
          read.onsuccess = () => { if (read.result?.expires > Date.now()) result = read.result.image; store.delete('pending'); };
        }
        tx.oncomplete = () => { db.close(); resolve(result); };
        tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
      };
    });
  }
  window.NailGalleryDraft = {save:image=>transfer('save',image),take:()=>transfer('take')};
}());
