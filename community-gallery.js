(async function(){
'use strict';
const $=id=>document.getElementById(id),t=JSON.parse($('gallery-copy').textContent),config=window.NailGalleryConfig||{};
const upload=$('upload-dialog'),art=$('art-dialog'),form=$('upload-form'),feed=$('community-feed');
let removeArmed=false,client=null,owner=null,blob=null,previewURL=null,selected=null,busy=false,offset=0,loading=false;
const locale=document.documentElement.lang||'ko',pageSize=24;
const date=value=>new Date(value).toLocaleDateString(locale,{year:'numeric',month:'short',day:'numeric'});
const text=(tag,value,className)=>{const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el};
const publicImage=path=>client.storage.from('nail-gallery').getPublicUrl(path).data.publicUrl;
function showArt(post){removeArmed=false;$('remove-post').textContent=t.remove;selected=post;$('art-title').textContent=post.title;$('art-image').src=post.image;$('art-image').alt=post.title;$('art-author').textContent=post.nickname;$('art-date').textContent=post.created_at?date(post.created_at):'';$('art-caption').textContent=post.caption||'';$('art-status').textContent='';$('remove-post').hidden=!(client&&owner&&post.owner_id===owner);const edit=$('art-edit');edit.hidden=!post.edit;if(post.edit)edit.href=post.edit;$('report-post').href='https://github.com/chacha2002-spec/nail-art-maker/issues/new?title='+encodeURIComponent('Gallery post: '+(post.id||post.title));art.showModal()}
function card(post){const item=text('article','','work-card'),button=text('button','','image-button'),img=new Image();img.src=post.image;img.alt=post.title;img.loading='lazy';button.append(img);button.addEventListener('click',()=>showArt(post));const copy=text('div','','work-copy');copy.append(text('span',post.nickname,'byline'),text('h3',post.title));if(post.caption)copy.append(text('p',post.caption));copy.append(text('time',date(post.created_at)));item.dataset.post=post.id;item.append(button,copy);return item}
$('open-upload').addEventListener('click',()=>upload.showModal());
for(const dialog of [upload,art])dialog.querySelector('.close-dialog').addEventListener('click',()=>{if(!busy)dialog.close()});
upload.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
document.querySelectorAll('[data-gallery-image]').forEach(button=>button.addEventListener('click',()=>showArt({title:button.dataset.title,image:button.dataset.galleryImage,caption:button.dataset.caption,nickname:'',edit:button.closest('article').querySelector('.gallery-edit')?.href})));
$('design-image').addEventListener('change',async e=>{
 blob=null;$('publish-button').disabled=true;$('upload-status').textContent='';
 if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null}$('upload-preview').hidden=true;$('choose-prompt').hidden=false;
 const file=e.target.files[0];if(!file)return;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024){$('upload-status').textContent=t.badfile;e.target.value='';return}
 try{
 const source=URL.createObjectURL(file),img=new Image();try{img.src=source;await img.decode();if(img.width*img.height>40000000)throw Error('large');const scale=Math.min(1,1600/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9));if(!blob||blob.size>3*1024*1024)throw Error('size')}finally{URL.revokeObjectURL(source)}
 previewURL=URL.createObjectURL(blob);$('upload-preview').src=previewURL;$('upload-preview').hidden=false;$('choose-prompt').hidden=true;$('publish-button').disabled=!client;
 }catch(_){blob=null;$('upload-status').textContent=t.badfile}
});
async function load(reset=false){if(!client||loading)return;loading=true;const message=$('feed-message');message.hidden=false;message.replaceChildren(text('p',t.loading));$('load-more').hidden=true;
 try{const {data,error}=await client.from('nail_gallery_posts').select('id,owner_id,title,nickname,caption,image_path,created_at').is('deleted_at',null).order('created_at',{ascending:false}).order('id',{ascending:false}).range(reset?0:offset,(reset?0:offset)+pageSize-1);if(error)throw error;if(reset){feed.querySelectorAll('[data-post]').forEach(el=>el.remove());offset=0}data.forEach(post=>feed.insertBefore(card({...post,image:publicImage(post.image_path)}),feed.querySelector('.initial-card')));offset+=data.length;message.hidden=feed.children.length>0;if(!feed.children.length)message.replaceChildren(text('span','✳','empty-art'),text('h3',t.empty),text('p',t.emptybody));$('load-more').hidden=data.length<pageSize;
 }catch(_){message.hidden=false;const retry=text('button',t.retry,'secondary');retry.addEventListener('click',()=>load(reset));message.replaceChildren(text('p',t.error),retry)}finally{loading=false}}
$('load-more').addEventListener('click',()=>load());
form.addEventListener('submit',async e=>{e.preventDefault();if(busy||!client)return;if(!blob){$('upload-status').textContent=t.needimage;return}if(!form.reportValidity())return;const fields=new FormData(form),nickname=String(fields.get('nickname')).trim(),title=String(fields.get('title')).trim(),caption=String(fields.get('caption')).trim();if(!nickname||!title)return;
 busy=true;form.setAttribute('aria-busy','true');$('publish-button').disabled=true;$('upload-status').textContent=t.uploading;let path=null,uploaded=false;
 try{let {data:{session}}=await client.auth.getSession();if(!session){const result=await client.auth.signInAnonymously();if(result.error)throw result.error;session=result.data.session}owner=session.user.id;path=owner+'/'+crypto.randomUUID()+'.jpg';const file=await client.storage.from('nail-gallery').upload(path,blob,{contentType:'image/jpeg',upsert:false});if(file.error)throw file.error;uploaded=true;const {error}=await client.from('nail_gallery_posts').insert({owner_id:owner,title,nickname,caption,image_path:path});if(error)throw error;
 form.reset();blob=null;$('upload-preview').hidden=true;$('choose-prompt').hidden=false;if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;upload.close();$('connection-note').textContent=t.success;$('connection-note').hidden=false;await load(true);
 }catch(_){if(uploaded&&path)await client.storage.from('nail-gallery').remove([path]);$('upload-status').textContent=t.failed}finally{busy=false;form.removeAttribute('aria-busy');$('publish-button').disabled=!blob}
});
$('remove-post').addEventListener('click',async()=>{if(!client||!selected||selected.owner_id!==owner)return;if(!removeArmed){removeArmed=true;$('remove-post').textContent=t.confirm;return}$('remove-post').disabled=true;try{const {error}=await client.from('nail_gallery_posts').update({deleted_at:new Date().toISOString()}).eq('id',selected.id).eq('owner_id',owner);if(error)throw error;art.close();await load(true)}catch(_){$('art-status').textContent=t.failed}finally{$('remove-post').disabled=false}});
if(config.url&&config.publishableKey){try{
 const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');client=createClient(config.url,config.publishableKey);const {data:{session}}=await client.auth.getSession();owner=session?.user.id||null;$('connection-note').hidden=true;$('open-upload').hidden=false;$('upload-unavailable').hidden=true;$('publish-button').disabled=!blob;await load(true);
 }catch(_){client=null;$('connection-note').textContent=t.error}}
})();
