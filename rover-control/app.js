// Standalone browser simulation. No network command, GPS, or camera connection.
const ROUTE = [[196,358],[196,91],[286,91],[286,358],[378,358],[378,91],[468,91],[468,365],[520,365],[520,175],[863,175],[863,300],[590,300]];
const WAYPOINTS = ['A1 北侧田埂','A1 北侧','A2 南侧','B1 南侧','B1 北侧','C1 北侧','C1 南侧','东侧管线','B2 北侧','B2 东侧','B2 南侧','B2 采样点'];
const lengths = ROUTE.slice(1).map(([x,y],i) => Math.hypot(x-ROUTE[i][0],y-ROUTE[i][1]));
const routeLength = lengths.reduce((a,b)=>a+b,0);
const $ = (id) => document.getElementById(id);
const state = {screen:'route',mode:'auto',status:'idle',progress:38,x:0,y:0,heading:0,battery:86,gear:1.2,direction:null,driveX:0,driveY:0,inputSource:null,pan:0,light:false,captures:0};
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
  const requested=location.hash.slice(1);const page=['route','control','camera'].includes(requested)?requested:'route';
  if(state.screen!==page)stopDrive();
  state.screen=page;
  for(const name of ['route','control','camera']){
    $(`page-${name}`).hidden=name!==page;
    $(`${name}-intro`).hidden=name!==page;
    const nav=document.querySelector(`[data-nav="${name}"]`);
    if(name===page)nav.setAttribute('aria-current','page');else nav.removeAttribute('aria-current');
  }
  document.title=`${{route:'巡检路线',control:'远程操控',camera:'镜头与设备'}[page]} · 惠农巡检小车`;
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
  Object.assign(state,routePosition(state.progress));render();showPage();
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
  $('capture-btn').addEventListener('click',()=>{state.captures++;toast('已记录一次模拟拍照');render()});
  $('light-btn').addEventListener('click',()=>{state.light=!state.light;toast(state.light?'模拟照明已开启':'模拟照明已关闭');render()});
  $('pan-left-btn').addEventListener('click',()=>{state.pan=Math.max(-45,state.pan-15);toast(`云台角度 ${state.pan}°`);render()});
  $('pan-right-btn').addEventListener('click',()=>{state.pan=Math.min(45,state.pan+15);toast(`云台角度 ${state.pan}°`);render()});
  requestAnimationFrame(tick);
});
