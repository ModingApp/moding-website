/* Homepage-only guest support. No app launch, member session or payment access. */
(() => {
  'use strict';
  const panel=document.querySelector('.preview-chat');
  if(!panel)return;
  const API='https://api.moding.app';
  const SESSION='moding_homepage_support_session_v1', DRAFTS='moding_homepage_support_drafts_v1';
  const content=panel.querySelector('.preview-chat-content'),form=panel.querySelector('form'),input=form.querySelector('textarea');
  const submit=form.querySelector('[type=submit]'),note=panel.querySelector('.preview-chat-note'),status=panel.querySelector('[role=status]');
  const back=panel.querySelector('[data-chat-back]'),close=panel.querySelector('[data-chat-close]');
  const inquiry=document.querySelector('.preview-inquiry'),scrim=document.querySelector('.preview-chat-backdrop');
  const topics={OTHER:'앱 이용 문의',SELLER_ONBOARDING:'판매자 입점 문의'};
  let session=read(localStorage,SESSION),drafts=read(sessionStorage,DRAFTS)||{},config=null,view=null,focusBefore=null;
  let generation=0,busy=false,stream=null,poll=null,reconnect=null,sessionPromise=null,refreshing=false;
  let messages=[],current=null,roomList=[],listPage=0,hasMore=false,attachments=[],uploading=false;
  function read(storage,key){try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}}
  function save(storage,key,value){try{storage.setItem(key,JSON.stringify(value))}catch{}}
  function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
  function button(text,action,cls){const b=element('button',text,cls);b.type='button';b.addEventListener('click',action);return b}
  function message(text){status.textContent=text||''}
  function validSession(){return session?.token&&Date.parse(session.expiresAt)>Date.now()}
  function ownerExpired(){session=null;try{localStorage.removeItem(SESSION)}catch{};stopLive();message('상담 접속 기간이 만료됐습니다. 새 문의를 작성해 주세요.');}
  async function request(path,{method='GET',body,guest=true,signal}={}){
    const headers={'Accept':'application/json'};
    if(guest){if(!validSession())throw Object.assign(new Error('상담 접속 정보가 없습니다.'),{status:401});headers['X-Consultation-Session']=session.token;}
    if(body&&!(body instanceof FormData))headers['Content-Type']='application/json';
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
    if(signal)signal.addEventListener('abort',()=>controller.abort(),{once:true});
    try{
      const response=await fetch(API+path,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,credentials:'omit',signal:controller.signal});
      const result=await response.json().catch(()=>({}));
      if(!response.ok||result.success!==true){
        if(response.status===401&&headers['X-Consultation-Session']===session?.token)ownerExpired();
        throw Object.assign(new Error(result.message||'요청을 처리하지 못했습니다. 다시 시도해 주세요.'),{status:response.status,code:result.code});
      }
      return result.data;
    }catch(error){if(error.name==='AbortError')throw new Error('응답을 확인하지 못했습니다. 같은 내용으로 다시 전송해 주세요.');throw error;}
    finally{clearTimeout(timeout)}
  }
  async function ensureSession(){
    if(validSession())return;
    if(!sessionPromise)sessionPromise=request('/api/v1/public/consultation-sessions',{method:'POST',guest:false}).then(data=>{session=data;save(localStorage,SESSION,data)}).finally(()=>{sessionPromise=null});
    await sessionPromise;
  }
  function draftKey(){return view?.id?'room:'+view.id:'new:'+(view?.category||'OTHER')}
  function draft(){return drafts[draftKey()]||(drafts[draftKey()]={body:'',pending:null})}
  function saveDraft(){if(!view||view.kind==='list')return;draft().body=input.value;save(sessionStorage,DRAFTS,drafts)}
  const baseUrl=()=>location.pathname+location.search;
  function navigate(next,replace=false){
    saveDraft();
    const previous=history.state?.modingHomepageChat;
    const state={...next,depth:replace?(previous?.depth||1):(previous?.depth||0)+1};
    history[replace?'replaceState':'pushState']({modingHomepageChat:state},'',baseUrl()+(state.id?'#consultation-'+state.id:'#consultation'));
    show(state);
  }
  function inertBackground(value){document.querySelector('.site-header')?.toggleAttribute('inert',value);document.querySelector('main')?.toggleAttribute('inert',value);document.getElementById('snapRoot')?.toggleAttribute('inert',value);}
  function displayPanel(){
    if(!panel.hidden)return;
    focusBefore=document.activeElement;
    document.getElementById('menuClose')?.click();
    panel.hidden=false;scrim.hidden=false;inertBackground(true);inquiry.hidden=true;close.focus();
    if(!matchMedia('(prefers-reduced-motion:reduce)').matches){
      const ease='cubic-bezier(.25,.1,.25,1)';panel.animate([{opacity:0,transform:'translateY(9%)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:ease});scrim.animate([{opacity:0},{opacity:1}],{duration:320,easing:ease});
    }
  }
  function hidePanel(){saveDraft();generation++;stopLive();panel.hidden=true;scrim.hidden=true;inquiry.hidden=false;inertBackground(false);view=null;focusBefore?.focus();}
  function closePanel(){const depth=history.state?.modingHomepageChat?.depth;if(depth)history.go(-depth);else{history.replaceState(null,'',baseUrl());hidePanel()}}
  function open(topic){if(panel.hidden){navigate({kind:'list'});if(topics[topic])navigate({kind:'compose',category:topic});}else if(topics[topic])navigate({kind:'compose',category:topic});}
  async function show(state){
    displayPanel();stopLive();generation++;const g=generation;view=state;messages=[];current=null;attachments=[];
    form.hidden=true;back.hidden=state.kind==='list';content.replaceChildren();message('');
    try{
      if(!config)config=await request('/api/v1/public/consultations/config',{guest:false});
      if(g!==generation)return;
      note.textContent=config.guidance||'문의 내용을 남겨주시면 모딩 상담원이 확인 후 안내해 드리겠습니다.';
      if(!config.enabled){message('상담 기능을 준비 중입니다. 잠시 후 다시 이용해 주세요.');return;}
      if(state.kind==='list')await loadList(g,true);
      else if(state.kind==='compose'){renderCompose();}
      else if(state.kind==='thread'){
        if(!validSession()){message('이 상담의 접속 정보가 만료됐거나 이 브라우저에 없습니다. 새 문의를 이용해 주세요.');content.append(button('새 문의',()=>navigate({kind:'list'},true)));return;}
        await refresh(g,true);if(g===generation){renderCompose();startLive(g);}
      }
    }catch(e){if(g===generation){message(e.message);content.append(button('다시 확인',()=>show(view)));}}
  }
  async function loadList(g,reset=false){
    if(reset){listPage=0;roomList=[];renderList();}
    if(!validSession())return;
    const data=await request('/api/v1/guest/consultations?page='+listPage);
    if(g!==generation)return;
    roomList.push(...data);hasMore=data.length===40;renderList();
  }
  function renderList(){
    content.replaceChildren(element('p','어떤 내용이 궁금하신가요?'));
    for(const [key,label]of Object.entries(topics))content.append(button(label,()=>navigate({kind:'compose',category:key}),'preview-chat-topic'));
    if(roomList.length){content.append(element('h3','이전 상담','consultation-list-title'));
      for(const room of roomList){const b=button('',()=>navigate({kind:'thread',id:room.id,category:room.category}),'consultation-room');
        b.append(element('strong',topics[room.category]||'이전 문의'),element('span',room.lastMessage||'사진 문의'),element('small',room.number+(room.unreadCount?' · 새 답변 '+room.unreadCount:'')));content.append(b);}
      if(hasMore)content.append(button('이전 상담 더 보기',async()=>{try{listPage++;await loadList(generation);}catch(e){listPage--;message(e.message)}}));
    }
  }
  function renderCompose(){
    form.hidden=false;input.value=draft().body||'';input.readOnly=Boolean(draft().pending);submit.textContent=draft().pending?'다시 전송':'전송';
    if(view.kind==='compose'){content.replaceChildren(element('p',topics[view.category]||'이용 문의','preview-chat-thread-label'));content.append(element('p','문의 내용을 작성해 주세요. 첫 메시지를 전송하면 상담이 접수됩니다.'));}
    configureAttachments();
  }
  function renderMessages(){
    const atBottom=content.scrollHeight-content.scrollTop-content.clientHeight<65,oldTop=content.scrollTop;
    content.replaceChildren();
    if(messages.length&&messages[0].seq>1)content.append(button('이전 메시지 보기',async()=>{
      const g=generation,oldHeight=content.scrollHeight;
      try{const older=await request('/api/v1/guest/consultations/'+view.id+'/messages?beforeSeq='+messages[0].seq);if(g!==generation)return;messages=[...older,...messages];renderMessages();content.scrollTop=content.scrollHeight-oldHeight;}catch(e){message(e.message)}
    }));
    content.append(element('p',(topics[current?.category]||'상담')+' · '+(current?.number||''),'preview-chat-thread-label'));
    for(const item of messages){const bubble=element('div',undefined,'consultation-message '+(item.senderKind==='OPERATOR'?'operator':'customer'));
      bubble.append(element('small',item.senderKind==='OPERATOR'?'모딩 상담원':'나'));
      if(item.body)bubble.append(element('p',item.body));
      for(const file of item.attachments||[])bubble.append(button('사진 보기',async()=>{try{const r=await request('/api/v1/guest/consultations/attachments/'+encodeURIComponent(file.id)+'/url');const url=r.url;if(typeof url==='string'&&url.startsWith('https://')){const photo=element('img',undefined,'consultation-photo');photo.src=url;photo.alt='상담 첨부 사진';photo.loading='lazy';bubble.append(photo);}}catch(e){message(e.message)}}));
      content.append(bubble);
    }
    content.scrollTop=atBottom?content.scrollHeight:oldTop;
  }
  async function refresh(g,first=false){
    if(refreshing||view?.kind!=='thread'||panel.hidden)return;
    refreshing=true;
    const id=view.id;
    try{
      const room=await request('/api/v1/guest/consultations/'+id);
      let after=messages.at(-1)?.seq||0,got=[];
      do{got=await request('/api/v1/guest/consultations/'+id+'/messages?afterSeq='+after);if(g!==generation)return;
        const known=new Set(messages.map(m=>m.seq));messages.push(...got.filter(m=>!known.has(m.seq)));after=messages.at(-1)?.seq||after;
      }while(got.length===100);
      if(g!==generation)return;current=room;renderMessages();if(first)content.scrollTop=content.scrollHeight;
      if(after)await request('/api/v1/guest/consultations/'+id+'/read',{method:'PUT',body:{lastReadSeq:after}});
    }finally{refreshing=false;}
  }
  function stopLive(){stream?.abort();stream=null;clearInterval(poll);clearTimeout(reconnect);poll=null;reconnect=null;}
  function startLive(g){
    stopLive();
    poll=setInterval(()=>{if(!document.hidden)refresh(g).catch(()=>{});},15000);
    const connect=async()=>{
      if(g!==generation||panel.hidden||document.hidden||!validSession())return;
      const controller=new AbortController();stream=controller;
      try{
        const res=await fetch(API+'/api/v1/guest/consultations/events',{headers:{Accept:'text/event-stream','X-Consultation-Session':session.token},credentials:'omit',signal:controller.signal});
        if(res.status===401){ownerExpired();return;}if(!res.ok)throw new Error('stream');
        await refresh(g);const reader=res.body.getReader(),decoder=new TextDecoder();let buffer='';
        while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const events=buffer.split(/\r?\n\r?\n/);buffer=events.pop();for(const event of events)if(/event:\s*changed/.test(event))refresh(g).catch(()=>{});if(buffer.length>65536)buffer='';}
      }catch(e){if(e.name==='AbortError')return;}
      if(g===generation&&!panel.hidden)reconnect=setTimeout(connect,3000);
    };connect();
  }
  const photoInput=document.createElement('input');photoInput.type='file';photoInput.accept='image/jpeg,image/png,image/webp';photoInput.multiple=true;photoInput.hidden=true;
  const attachButton=button('사진 첨부',()=>photoInput.click(),'consultation-attach'),attachmentList=element('div',undefined,'consultation-attachments');form.prepend(attachmentList,attachButton,photoInput);
  function configureAttachments(){attachButton.hidden=!config?.attachmentsEnabled;attachButton.disabled=busy||uploading||Boolean(draft().pending);attachmentList.replaceChildren();
    for(const file of attachments)attachmentList.append(button(file.name+' ×',()=>{attachments=attachments.filter(x=>x.id!==file.id);configureAttachments()}));}
  photoInput.addEventListener('change',async()=>{
    const files=[...photoInput.files];photoInput.value='';if(!files.length)return;
    if(files.length+attachments.length>config.maxPhotos){message('사진은 최대 '+config.maxPhotos+'장까지 첨부할 수 있습니다.');return;}
    if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>config.maxPhotoBytes)){message('JPEG·PNG·WebP 사진을 장당 10MB 이하로 선택해 주세요.');return;}
    uploading=true;submit.disabled=true;configureAttachments();const g=generation;
    try{await ensureSession();for(const file of files){const body=new FormData();body.append('file',file);const a=await request('/api/v1/guest/consultations/attachments',{method:'POST',body});if(g!==generation)return;attachments.push({...a,name:file.name});}message('사진이 첨부됐습니다. 전송을 누르면 함께 접수됩니다.');}
    catch(e){message(e.message)}finally{uploading=false;submit.disabled=false;configureAttachments();}
  });
  input.addEventListener('input',saveDraft);
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||uploading||!view||view.kind==='list')return;
    const localView={...view},key=draftKey(),data=draft(),g=generation;
    const body=input.value.trim();if(!data.pending&&!body&&!attachments.length){input.focus();return;}
    busy=true;submit.disabled=true;input.readOnly=true;configureAttachments();message('전송 중입니다.');
    try{
      await ensureSession();
      if(!data.pending){const msg={clientMessageId:crypto.randomUUID(),body,attachmentIds:attachments.map(a=>a.id)};
        data.pending=localView.id?msg:{clientConversationId:crypto.randomUUID(),category:localView.category,productId:null,orderId:null,message:msg,entrySource:'HOMEPAGE',entryPage:document.body.dataset.page||'index'};save(sessionStorage,DRAFTS,drafts);}
      const result=await request('/api/v1/guest/consultations'+(localView.id?'/'+localView.id+'/messages':''),{method:'POST',body:data.pending});
      drafts[key]={body:'',pending:null};save(sessionStorage,DRAFTS,drafts);
      if(g===generation){input.value='';attachments=[];if(!localView.id)navigate({kind:'thread',id:result.id,category:localView.category},true);else{await refresh(g);message('접수됐습니다.');}}
    }catch(e){if(g===generation)message(e.message);if(e.status&&e.status>=400&&e.status<500&&e.code!=='CONSULTATION_BUSY'&&e.status!==429){data.pending=null;save(sessionStorage,DRAFTS,drafts);}}
    finally{busy=false;submit.disabled=false;if(view&&view.kind!=='list'){input.readOnly=Boolean(draft().pending);submit.textContent=draft().pending?'다시 전송':'전송';configureAttachments();}}
  });
  inquiry.addEventListener('click',()=>open());
  document.querySelectorAll('[data-chat]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();open(b.dataset.chat==='판매자 입점 문의'?'SELLER_ONBOARDING':undefined)}));
  close.addEventListener('click',closePanel);scrim.addEventListener('click',closePanel);back.addEventListener('click',()=>history.back());
  addEventListener('popstate',()=>{saveDraft();const state=history.state?.modingHomepageChat;if(state)show(state);else hidePanel();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLive();else if(view?.kind==='thread'){refresh(generation).catch(()=>{});startLive(generation);}});
  document.addEventListener('keydown',e=>{if(panel.hidden)return;if(e.key==='Escape'){e.preventDefault();view?.kind!=='list'?history.back():closePanel();}
    if(e.key==='Tab'){const nodes=[...panel.querySelectorAll('button,textarea,input,a[href]')].filter(n=>!n.disabled&&n.getBoundingClientRect().height);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}});
  addEventListener('storage',e=>{if(e.key===SESSION){session=read(localStorage,SESSION);if(!panel.hidden)show(view||{kind:'list'});}});
  function viewport(){if(!window.visualViewport)return;panel.style.setProperty('--support-height',visualViewport.height+'px');panel.style.setProperty('--support-top',visualViewport.offsetTop+'px');}
  window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);viewport();
  const stored=history.state?.modingHomepageChat;
  if(stored)show(stored);else if(location.hash.startsWith('#consultation')){const id=Number(location.hash.match(/^#consultation-(\d+)$/)?.[1]);history.replaceState(null,'',baseUrl());open();if(id>0)navigate({kind:'thread',id});}
})();
