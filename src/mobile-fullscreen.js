const TOUCH_MODE=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
if(TOUCH_MODE){
  const raid=document.querySelector('#raid');
  const raidBtn=document.querySelector('#raidBtn');
  let requestedByRaid=false;

  const raidActive=()=>raid&&!raid.classList.contains('hidden');
  const syncRaidViewport=()=>{
    const active=raidActive();
    document.body.classList.toggle('mobileRaidFullscreen',active);
    if(!active&&requestedByRaid&&document.fullscreenElement){
      document.exitFullscreen?.().catch?.(()=>{});
      requestedByRaid=false;
    }
  };

  const requestRaidFullscreen=async()=>{
    try{
      if(!document.fullscreenElement&&document.documentElement.requestFullscreen){
        await document.documentElement.requestFullscreen({navigationUI:'hide'});
        requestedByRaid=true;
      }
    }catch{}
    try{await screen.orientation?.lock?.('landscape')}catch{}
  };

  raidBtn?.addEventListener('pointerdown',()=>{requestRaidFullscreen()});
  if(raid)new MutationObserver(syncRaidViewport).observe(raid,{attributes:true,attributeFilter:['class']});
  document.addEventListener('fullscreenchange',syncRaidViewport);
  window.addEventListener('orientationchange',syncRaidViewport);
  syncRaidViewport();
}
