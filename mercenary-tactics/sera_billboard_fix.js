(()=>{
  const center=document.querySelector('.center');
  if(!center)return;

  const layer=document.createElement('div');
  layer.id='billboardUnits';
  Object.assign(layer.style,{
    position:'absolute',inset:'0',pointerEvents:'none',zIndex:'80',overflow:'visible'
  });
  center.appendChild(layer);

  const art=document.createElement('div');
  art.id='seraBillboard';
  Object.assign(art.style,{
    position:'absolute',width:'80px',aspectRatio:'228 / 300',
    backgroundRepeat:'no-repeat',backgroundPosition:'center bottom',backgroundSize:'contain',
    transformOrigin:'50% 100%',pointerEvents:'auto',cursor:'pointer',
    filter:'drop-shadow(0 8px 5px rgba(0,0,0,.7))',
    transition:'filter .15s ease'
  });
  layer.appendChild(art);

  art.addEventListener('click',()=>{
    const u=document.querySelector('#units .spriteUnit');
    if(u)u.click();
  });

  function tick(){
    const u=document.querySelector('#units .spriteUnit');
    if(!u||!window.ASSET||!ASSET.s){
      art.style.display='none';
      requestAnimationFrame(tick);
      return;
    }

    const old=u.querySelector('.spriteImg');
    if(old)old.style.visibility='hidden';

    const ur=u.getBoundingClientRect();
    const cr=center.getBoundingClientRect();
    if(!ur.width||!ur.height){
      art.style.display='none';
      requestAnimationFrame(tick);
      return;
    }

    const x=ur.left+ur.width/2-cr.left;
    const y=ur.bottom-cr.top;
    const w=Math.max(58,Math.min(104,ur.width*1.55));
    art.style.display='block';
    art.style.left=x+'px';
    art.style.top=y+'px';
    art.style.width=w+'px';
    art.style.backgroundImage=`url("${ASSET.s}")`;

    const selected=u.classList.contains('selected');
    art.style.transform=`translate(-50%,-94%) scale(${selected?1.10:1})`;
    if(u.classList.contains('acted')) art.style.filter='grayscale(.65) brightness(.58) drop-shadow(0 8px 5px rgba(0,0,0,.7))';
    else if(u.classList.contains('attackable')) art.style.filter='drop-shadow(0 0 8px #ff525f) drop-shadow(0 8px 5px rgba(0,0,0,.7))';
    else if(u.classList.contains('healable')) art.style.filter='drop-shadow(0 0 8px #5fe6a3) drop-shadow(0 8px 5px rgba(0,0,0,.7))';
    else if(selected) art.style.filter='drop-shadow(0 0 7px #e7cd8f) drop-shadow(0 8px 5px rgba(0,0,0,.7))';
    else art.style.filter='drop-shadow(0 8px 5px rgba(0,0,0,.7))';

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
