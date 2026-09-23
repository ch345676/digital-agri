// Standalone browser simulation. No network command, GPS, or camera connection.
const ROUTE = [[196,358],[196,91],[286,91],[286,358],[378,358],[378,91],[468,91],[468,365],[520,365],[520,175],[863,175],[863,300],[590,300]];
const WAYPOINTS = ['A1 北侧田埂','A1 北侧','A2 南侧','B1 南侧','B1 北侧','C1 北侧','C1 南侧','东侧管线','B2 北侧','B2 东侧','B2 南侧','B2 采样点'];
const lengths = ROUTE.slice(1).map(([x,y],i) => Math.hypot(x-ROUTE[i][0],y-ROUTE[i][1]));
const routeLength = lengths.reduce((a,b)=>a+b,0);
const $ = (id) => document.getElementById(id);
const state = {screen:'route',mode:'auto',status:'idle',progress:38,x:0,y:0,heading:0,battery:86,gear:1.2,direction:null,driveX:0,driveY:0,inputSource:null,pan:0,light:false,captures:0};
const PHOTO_TYPES = {
  downy:{title:'大豆叶片疑似异常',file:'downy-mildew.jpg',credit:'Clemson University / USDA Extension',source:'https://commons.wikimedia.org/wiki/File:Peronospora_manshurica_on_soybean_leaf.jpg',license:'CC BY 3.0'},
  powdery:{title:'大豆叶片白色斑块',file:'powdery-mildew.jpg',credit:'Madan_subedi01',source:'https://commons.wikimedia.org/wiki/File:Powdery_Mildew_on_Soyabean_leaves.jpg',license:'CC BY 3.0'},
  aphids:{title:'甘蓝叶片虫群',file:'aphids.jpg',credit:'Sanjay Acharya',source:'https://commons.wikimedia.org/wiki/File:Aphids_on_Kale_leaf.jpg',license:'CC BY-SA 4.0'}
};
const SAMPLE_ISSUES = [
  {id:'sample-1',type:'downy',x:202,y:150,field:'A1',time:'演示样本',sample:true},
  {id:'sample-2',type:'powdery',x:376,y:185,field:'B1',time:'演示样本',sample:true},
  {id:'sample-3',type:'aphids',x:751,y:284,field:'B2',time:'演示样本',sample:true}
];
const ISSUE_KEY='huinong-rover-issues-v1';
const SPRAY_KEY='huinong-rover-spray-plan-v1';
function readStored(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
const savedIssues=readStored(ISSUE_KEY,[]);
const issues=Array.isArray(savedIssues)?savedIssues.filter(item=>item&&PHOTO_TYPES[item.type]&&Number.isFinite(item.x)&&Number.isFinite(item.y)&&item.x>=0&&item.x<=1000&&item.y>=0&&item.y<=560&&typeof item.id==='string'&&/^capture-[\w-]{1,40}$/.test(item.id)&&typeof item.field==='string'&&item.field.length<20&&typeof item.time==='string'&&item.time.length<50).slice(0,100):[];
let sprayPlan=readStored(SPRAY_KEY,null);
if(!sprayPlan||!['A1','A2','B1','C1','B2'].includes(sprayPlan.field)||!['spot','area'].includes(sprayPlan.scope))sprayPlan=null;
let selectedIssue=null;
let toastTimer = 0;
let lastFrame = performance.now();
let joystickPointerId = null;

function routePosition(progress){
  let distance=routeLength*Math.max(0,Math.min(100,progress))/100;
  for(let i=0;i<lengths.length;i++){
    const [x1,y1]=ROUTE[i], [x2,y2]=ROUTE[i+1];
    if(distance<=lengths[i]){
      const t=distance/lengths[i];
      return {x:x1+(x2-x1)*t,y:y1+(y2-y1)*t,heading:Math.atan2(y2-y1,x2-x1)*180/Math.PI+90,next:i};
    }
    distance-=lengths[i];
  }
  const [x,y]=ROUTE.at(-1);
  return {x,y,heading:90,next:WAYPOINTS.length-1};
}
function toast(message){
  const el=$('toast');el.textContent=message;el.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400);
}
function canDrive(){return state.screen==='control'&&state.mode==='manual'&&state.status==='manual'}
function setDirection(direction,source='buttons'){
  if(!canDrive())return;
  const vectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  [state.driveX,state.driveY]=vectors[direction];
  state.direction=direction;state.inputSource=source;
  document.querySelectorAll('[data-direction]').forEach(el=>el.classList.toggle('active',el.dataset.direction===direction&&source==='buttons'));
  render();
}
function stopDrive(){
  state.driveX=0;state.driveY=0;state.direction=null;state.inputSource=null;joystickPointerId=null;
  document.querySelectorAll('[data-direction]').forEach(el=>el.classList.remove('active'));
  $('joystick').classList.remove('active');$('joystick').style.setProperty('--stick-x','0px');$('joystick').style.setProperty('--stick-y','0px');
  render();
}
function updateJoystick(event){
  if(!canDrive())return;
  const pad=$('joystick');const rect=pad.getBoundingClientRect();const radius=(rect.width-72)/2;
  const dx=event.clientX-(rect.left+rect.width/2),dy=event.clientY-(rect.top+rect.height/2);
  const distance=Math.hypot(dx,dy);const scale=distance>radius?radius/distance:1;
  const x=dx*scale/radius,y=dy*scale/radius;
  state.driveX=distance<radius*.12?0:x;state.driveY=distance<radius*.12?0:y;
  state.direction=null;state.inputSource='joystick';
  pad.classList.add('active');pad.style.setProperty('--stick-x',`${dx*scale}px`);pad.style.setProperty('--stick-y',`${dy*scale}px`);
  render();
}
function showPage(){
  const requested=location.hash.slice(1);const pages=['route','control','camera','album','spray'];const page=pages.includes(requested)?requested:'route';
  if(state.screen!==page)stopDrive();
  state.screen=page;
  for(const name of pages){
    $(`page-${name}`).hidden=name!==page;
    $(`${name}-intro`).hidden=name!==page;
    const nav=document.querySelector(`[data-nav="${name}"]`);
    if(name===page)nav.setAttribute('aria-current','page');else nav.removeAttribute('aria-current');
  }
  document.title=`${{route:'巡检路线',control:'远程操控',camera:'镜头与设备',album:'异常相册',spray:'喷洒作业'}[page]} · 惠农巡检小车`;
  window.scrollTo({top:0,behavior:'instant'});
}
function render(){
  const labels={idle:'待命',cruising:'巡航中',manual:'手动驾驶',returning:'返航中',docked:'充电桩待命',stopped:'已紧急停止'};
  $('status').textContent=labels[state.status];
  $('status-led').classList.toggle('stopped',state.status==='stopped');
  $('battery').textContent=`${Math.round(state.battery)}%`;
  const driveMagnitude=Math.min(1,Math.hypot(state.driveX,state.driveY));
  $('speed').innerHTML=`${(state.status==='cruising'?state.gear:state.status==='returning'?0.8:state.status==='manual'?state.gear*driveMagnitude:0).toFixed(1)} <sub>m/s</sub>`;
  $('progress').textContent=`${state.progress.toFixed(0)}%`;
  $('progress-fill').style.width=`${state.progress}%`;
  $('route-done').setAttribute('stroke-dasharray',`${state.progress} 100`);
  $('rover-marker').setAttribute('transform',`translate(${state.x.toFixed(1)} ${state.y.toFixed(1)}) rotate(${state.heading.toFixed(1)})`);
  const target=routePosition(state.progress);
  $('route-target').textContent=state.status==='returning'?'目标 · 充电桩':state.status==='docked'?'已返回充电桩':`下一站 · ${WAYPOINTS[target.next] || 'B2 采样点'}`;
  $('mode-label').textContent=state.mode==='auto'?'自动模式':'手动模式';
  $('auto-mode').classList.toggle('selected',state.mode==='auto');$('auto-mode').setAttribute('aria-pressed',state.mode==='auto');
  $('manual-mode').classList.toggle('selected',state.mode==='manual');$('manual-mode').setAttribute('aria-pressed',state.mode==='manual');
  $('auto-panel').hidden=state.mode!=='auto';$('manual-panel').hidden=state.mode!=='manual';
  $('cruise-btn').textContent=state.status==='cruising'?'暂停巡航':state.progress>=100?'重新巡航':state.status==='stopped'?'急停中 · 请先解除':'开始 / 继续巡航';
  $('cruise-btn').disabled=state.status==='stopped'||state.status==='returning';
  $('return-btn').disabled=state.status==='stopped'||state.status==='returning'||state.status==='docked';
  $('stop-btn').innerHTML=state.status==='stopped'?'↻ <span>解除急停</span>':'■ <span>紧急停止</span>';
  $('light-btn').classList.toggle('on',state.light);$('light-btn').setAttribute('aria-pressed',state.light);
  $('light-btn').querySelector('span').textContent=state.light?'照明开启':'照明关闭';
  $('pan-angle').textContent=`${state.pan}°`;$('capture-count').textContent=`${state.captures} 张`;
}
function fieldAt(x,y){
  if(x<245)return 'A1';if(x<333)return 'A2';if(x<424)return 'B1';if(x<515)return 'C1';if(x>575)return 'B2';
  return y<180?'B2':'田埂';
}
function addText(parent,tag,value,className){const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;parent.append(el);return el}
function renderIssueMarkers(){
  const group=$('issue-markers');group.replaceChildren();
  for(const item of [...SAMPLE_ISSUES,...issues]){
    const marker=document.createElementNS('http://www.w3.org/2000/svg','g');marker.setAttribute('transform',`translate(${item.x} ${item.y})`);marker.setAttribute('class',`issue-marker${item.id===selectedIssue?' selected':''}`);marker.setAttribute('role','button');marker.setAttribute('tabindex','0');marker.setAttribute('aria-label',`${item.field} ${PHOTO_TYPES[item.type].title}，查看相册`);
    const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('r','14');
    const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('text-anchor','middle');text.setAttribute('y','5');text.textContent='!';marker.append(circle,text);
    const open=()=>{selectedIssue=item.id;renderIssueMarkers();renderAlbum();location.hash='album';setTimeout(()=>document.querySelector(`[data-issue-id="${item.id}"]`)?.scrollIntoView({block:'center'}),30)};
    marker.addEventListener('click',open);marker.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open()}});group.append(marker);
  }
}
function renderAlbum(){
  const list=$('album-list');list.replaceChildren();const all=[...issues].reverse().concat(SAMPLE_ISSUES);
  $('issue-count').textContent=`${all.length} 条记录`;
  for(const item of all){
    const photo=PHOTO_TYPES[item.type];const card=addText(list,'article','',`issue-card${item.id===selectedIssue?' selected':''}`);card.dataset.issueId=item.id;
    const img=document.createElement('img');img.src=`./assets/${photo.file}`;img.alt=`${photo.title}的真实参考照片`;img.loading='lazy';card.append(img);
    const body=addText(card,'div','', 'issue-body');
    const header=addText(body,'div','', 'issue-header');addText(header,'strong',photo.title);addText(header,'span','待人工复核','issue-status');
    addText(body,'p',`${item.sample?'预置演示记录':'模拟拍照记录'} · ${item.time}`,'issue-time');
    addText(body,'p',`地点 ${item.field} 地块 · 示意坐标 ${Math.round(item.x)}, ${Math.round(item.y)}`,'issue-location');
    const actions=addText(body,'div','','issue-actions');
    const map=addText(actions,'button','在路线中查看');map.type='button';map.addEventListener('click',()=>{selectedIssue=item.id;renderIssueMarkers();renderAlbum();location.hash='route';toast(`已标记 ${item.field} 地块的异常位置`)});
    const plan=addText(actions,'button','规划喷洒');plan.type='button';plan.addEventListener('click',()=>{$('spray-field').value=item.field==='田埂'?'B2':item.field;$('spray-scope').value='spot';$('spray-note').value=`核实 ${photo.title} 后再确定处理方案`;location.hash='spray';toast('已带入目标地块，请先核实异常')});
    const credit=addText(body,'p','真实参考照片：','issue-credit');const link=addText(credit,'a',`${photo.credit} · ${photo.license}`);link.href=photo.source;link.target='_blank';link.rel='noopener noreferrer';
  }
}
function renderSprayPlan(){
  const el=$('spray-plan');el.replaceChildren();el.hidden=!sprayPlan;if(!sprayPlan)return;
  addText(el,'small','已保存的本机演示计划');addText(el,'strong',`${sprayPlan.field} 地块 · ${sprayPlan.scope==='spot'?'定点喷洒':'区域喷洒'}`);addText(el,'p',sprayPlan.note||'未填写备注');addText(el,'span','待模块上线与人工确认 · 未执行');
}
function selectMode(mode){
  if(state.status==='stopped'){toast('请先解除紧急停止');return}
  if(state.status==='returning'){toast('返航期间暂不可切换模式');return}
  if(state.mode===mode)return;
  stopDrive();state.mode=mode;
  if(mode==='manual'){state.status='manual'}
  else{const point=routePosition(state.progress);Object.assign(state,{x:point.x,y:point.y,heading:point.heading,status:'idle'})}
  render();
}
function tick(now){
  const dt=Math.min(.08,(now-lastFrame)/1000);lastFrame=now;
  if(document.visibilityState==='visible'){
    if(state.status==='cruising'){
      state.progress=Math.min(100,state.progress+dt*state.gear*.64);
      const point=routePosition(state.progress);state.x=point.x;state.y=point.y;state.heading=point.heading;
      state.battery=Math.max(10,state.battery-dt*.012);
      if(state.progress>=100){state.status='idle';toast('巡检路线演示完成')}
      render();
    }else if(state.status==='manual'&&Math.hypot(state.driveX,state.driveY)>.01){
      state.x=Math.max(130,Math.min(900,state.x+state.driveX*state.gear*65*dt));
      state.y=Math.max(55,Math.min(400,state.y+state.driveY*state.gear*65*dt));
      state.heading=Math.atan2(state.driveY,state.driveX)*180/Math.PI+90;
      state.battery=Math.max(10,state.battery-dt*.016*Math.hypot(state.driveX,state.driveY));render();
    }else if(state.status==='returning'){
      const [dx,dy]=[ROUTE[0][0]-state.x,ROUTE[0][1]-state.y];const distance=Math.hypot(dx,dy);
      if(distance<3){state.x=ROUTE[0][0];state.y=ROUTE[0][1];state.status='docked';state.progress=0;toast('已返回充电桩')}
      else{const step=Math.min(distance,125*dt);state.x+=dx/distance*step;state.y+=dy/distance*step;state.heading=Math.atan2(dy,dx)*180/Math.PI+90}
      render();
    }
  }
  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded',()=>{
  Object.assign(state,routePosition(state.progress));state.captures=issues.length;render();renderAlbum();renderIssueMarkers();renderSprayPlan();showPage();
  window.addEventListener('hashchange',showPage);
  $('auto-mode').addEventListener('click',()=>selectMode('auto'));
  $('manual-mode').addEventListener('click',()=>selectMode('manual'));
  const changeInputMethod=(method)=>{
    stopDrive();
    $('joystick-wrap').hidden=method!=='joystick';$('dpad').hidden=method!=='buttons';
    $('joystick-mode').classList.toggle('selected',method==='joystick');$('joystick-mode').setAttribute('aria-pressed',method==='joystick');
    $('buttons-mode').classList.toggle('selected',method==='buttons');$('buttons-mode').setAttribute('aria-pressed',method==='buttons');
    $('drive-hint').textContent=method==='joystick'?'拖动摇杆控制方向与速度，松手立即停车。':'按住方向键移动，松开立即停车；键盘方向键也可操作。';
  };
  $('joystick-mode').addEventListener('click',()=>changeInputMethod('joystick'));
  $('buttons-mode').addEventListener('click',()=>changeInputMethod('buttons'));
  $('cruise-btn').addEventListener('click',()=>{
    if(state.status==='cruising'){state.status='idle';toast('巡航已暂停')}
    else{if(state.progress>=100){state.progress=0;Object.assign(state,routePosition(0))}state.status='cruising';toast('已开始模拟巡航')}
    render();
  });
  $('return-btn').addEventListener('click',()=>{stopDrive();state.status='returning';toast('模拟返航中');render()});
  $('stop-btn').addEventListener('click',()=>{
    if(state.status==='stopped'){state.status=state.mode==='manual'?'manual':'idle';toast('已解除模拟急停')}
    else{stopDrive();state.status='stopped';toast('模拟急停已触发')}
    render();
  });
  document.querySelectorAll('[data-gear]').forEach(button=>button.addEventListener('click',()=>{
    state.gear=Number(button.dataset.gear);document.querySelectorAll('[data-gear]').forEach(el=>el.classList.toggle('selected',el===button));toast(`速度档位 ${state.gear.toFixed(1)} m/s`);render();
  }));
  document.querySelectorAll('[data-direction]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);setDirection(button.dataset.direction)});
    button.addEventListener('pointerup',()=>{if(state.inputSource==='buttons')stopDrive()});
    button.addEventListener('pointercancel',()=>{if(state.inputSource==='buttons')stopDrive()});
    button.addEventListener('lostpointercapture',()=>{if(state.inputSource==='buttons')stopDrive()});
  });
  const pad=$('joystick');
  pad.addEventListener('pointerdown',event=>{
    if(!canDrive())return;
    event.preventDefault();joystickPointerId=event.pointerId;pad.setPointerCapture(event.pointerId);updateJoystick(event);
  });
  pad.addEventListener('pointermove',event=>{if(event.pointerId===joystickPointerId){event.preventDefault();updateJoystick(event)}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,event=>{if(event.pointerId===joystickPointerId)stopDrive()});
  const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};
  document.addEventListener('keydown',event=>{if(keys[event.key]&&canDrive()){event.preventDefault();setDirection(keys[event.key],'keyboard')}});
  document.addEventListener('keyup',event=>{if(keys[event.key]&&state.inputSource==='keyboard'&&state.direction===keys[event.key])stopDrive()});
  window.addEventListener('blur',stopDrive);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopDrive()});
  $('capture-btn').addEventListener('click',()=>{
    const type=$('capture-type').value;
    const item={id:`capture-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,type,x:Math.round(state.x),y:Math.round(state.y),field:fieldAt(state.x,state.y),time:new Date().toLocaleString('zh-CN',{hour12:false})};
    issues.push(item);if(issues.length>100)issues.shift();
    try{localStorage.setItem(ISSUE_KEY,JSON.stringify(issues))}catch{toast('浏览器存储不可用，记录只在当前页面保留')}
    state.captures=issues.length;render();renderAlbum();renderIssueMarkers();toast(`已存入异常相册 · ${item.field} 地块`);
  });
  $('light-btn').addEventListener('click',()=>{state.light=!state.light;toast(state.light?'模拟照明已开启':'模拟照明已关闭');render()});
  $('pan-left-btn').addEventListener('click',()=>{state.pan=Math.max(-45,state.pan-15);toast(`云台角度 ${state.pan}°`);render()});
  $('pan-right-btn').addEventListener('click',()=>{state.pan=Math.min(45,state.pan+15);toast(`云台角度 ${state.pan}°`);render()});
  $('spray-form').addEventListener('submit',event=>{
    event.preventDefault();sprayPlan={field:$('spray-field').value,scope:$('spray-scope').value,note:$('spray-note').value.trim().slice(0,120)};
    try{localStorage.setItem(SPRAY_KEY,JSON.stringify(sprayPlan))}catch{toast('浏览器存储不可用，计划只在当前页面保留')}
    renderSprayPlan();toast('模拟作业计划已保存；喷洒模块仍离线');
  });
  if(sprayPlan){$('spray-field').value=sprayPlan.field;$('spray-scope').value=sprayPlan.scope;$('spray-note').value=typeof sprayPlan.note==='string'?sprayPlan.note.slice(0,120):''}
  requestAnimationFrame(tick);
});
