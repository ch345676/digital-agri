// Standalone browser simulation. No network command, GPS, or camera connection.
const ROUTE = [[196,358],[196,91],[286,91],[286,358],[378,358],[378,91],[468,91],[468,365],[520,365],[520,175],[863,175],[863,300],[590,300]];
const WAYPOINTS = ['A1 北侧田埂','A1 北侧','A2 南侧','B1 南侧','B1 北侧','C1 北侧','C1 南侧','东侧管线','B2 北侧','B2 东侧','B2 南侧','B2 采样点'];
const lengths = ROUTE.slice(1).map(([x,y],i) => Math.hypot(x-ROUTE[i][0],y-ROUTE[i][1]));
const routeLength = lengths.reduce((a,b)=>a+b,0);
const $ = (id) => document.getElementById(id);
const state = {mode:'auto',status:'idle',progress:38,x:0,y:0,heading:0,battery:86,gear:1.2,direction:null,pan:0,light:false,captures:0};
let toastTimer = 0;
let lastFrame = performance.now();

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
function setDirection(direction){
  state.direction=state.mode==='manual'&&state.status!=='stopped'&&state.status!=='returning'?direction:null;
  document.querySelectorAll('[data-direction]').forEach(el=>el.classList.toggle('active',el.dataset.direction===state.direction));
  render();
}
function stopDirection(){if(state.direction)setDirection(null)}
function render(){
  const labels={idle:'待命',cruising:'巡航中',manual:'手动驾驶',returning:'返航中',docked:'充电桩待命',stopped:'已紧急停止'};
  $('status').textContent=labels[state.status];
  $('status-led').classList.toggle('stopped',state.status==='stopped');
  $('battery').textContent=`${Math.round(state.battery)}%`;
  $('speed').innerHTML=`${(state.status==='cruising'?state.gear:state.status==='returning'?0.8:state.direction?state.gear:0).toFixed(1)} <sub>m/s</sub>`;
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
  stopDirection();state.mode=mode;
  if(mode==='manual'){state.status='manual';toast('手动模式：按住方向键驾驶')}
  else{const point=routePosition(state.progress);Object.assign(state,{x:point.x,y:point.y,heading:point.heading,status:'idle'});toast('已切回示意巡检路线')}
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
    }else if(state.status==='manual'&&state.direction){
      const vectors={up:[0,-1,0],down:[0,1,180],left:[-1,0,-90],right:[1,0,90]};
      const [vx,vy,angle]=vectors[state.direction];
      state.x=Math.max(130,Math.min(900,state.x+vx*state.gear*65*dt));
      state.y=Math.max(55,Math.min(400,state.y+vy*state.gear*65*dt));
      state.heading=angle;state.battery=Math.max(10,state.battery-dt*.016);render();
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
  Object.assign(state,routePosition(state.progress));render();
  $('auto-mode').addEventListener('click',()=>selectMode('auto'));
  $('manual-mode').addEventListener('click',()=>selectMode('manual'));
  $('cruise-btn').addEventListener('click',()=>{
    if(state.status==='cruising'){state.status='idle';toast('巡航已暂停')}
    else{if(state.progress>=100){state.progress=0;Object.assign(state,routePosition(0))}state.status='cruising';toast('已开始模拟巡航')}
    render();
  });
  $('return-btn').addEventListener('click',()=>{stopDirection();state.status='returning';toast('模拟返航中');render()});
  $('stop-btn').addEventListener('click',()=>{
    if(state.status==='stopped'){state.status=state.mode==='manual'?'manual':'idle';toast('已解除模拟急停')}
    else{stopDirection();state.status='stopped';toast('模拟急停已触发')}
    render();
  });
  document.querySelectorAll('[data-gear]').forEach(button=>button.addEventListener('click',()=>{
    state.gear=Number(button.dataset.gear);document.querySelectorAll('[data-gear]').forEach(el=>el.classList.toggle('selected',el===button));toast(`速度档位 ${state.gear.toFixed(1)} m/s`);render();
  }));
  document.querySelectorAll('[data-direction]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);setDirection(button.dataset.direction)});
    button.addEventListener('pointerup',stopDirection);button.addEventListener('pointercancel',stopDirection);
    button.addEventListener('lostpointercapture',stopDirection);
  });
  const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};
  document.addEventListener('keydown',event=>{if(keys[event.key]&&state.mode==='manual'){event.preventDefault();setDirection(keys[event.key])}});
  document.addEventListener('keyup',event=>{if(keys[event.key]&&state.direction===keys[event.key])stopDirection()});
  window.addEventListener('blur',stopDirection);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopDirection()});
  $('capture-btn').addEventListener('click',()=>{state.captures++;toast('已记录一次模拟拍照');render()});
  $('light-btn').addEventListener('click',()=>{state.light=!state.light;toast(state.light?'模拟照明已开启':'模拟照明已关闭');render()});
  $('pan-left-btn').addEventListener('click',()=>{state.pan=Math.max(-45,state.pan-15);toast(`云台角度 ${state.pan}°`);render()});
  $('pan-right-btn').addEventListener('click',()=>{state.pan=Math.min(45,state.pan+15);toast(`云台角度 ${state.pan}°`);render()});
  requestAnimationFrame(tick);
});
