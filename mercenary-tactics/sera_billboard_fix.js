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
    position:'absolute',width:'80px',height:'120px',
    transformOrigin:'50% 100%',pointerEvents:'auto',cursor:'pointer',
    transition:'filter .15s ease, transform .15s ease'
  });

  const img=document.createElement('img');
  img.id='seraBillboardImg';
  img.alt='세라';
  Object.assign(img.style,{
    display:'block',position:'absolute',left:'50%',bottom:'0',
    width:'100%',height:'100%',objectFit:'contain',objectPosition:'center bottom',
    transform:'translateX(-50%)',pointerEvents:'none',
    filter:'drop-shadow(0 8px 5px rgba(0,0,0,.7))'
  });
  art.appendChild(img);
  layer.appendChild(art);

  let loadedSrc='';
  img.addEventListener('load',()=>{ art.dataset.loaded='1'; });
  img.addEventListener('error',()=>{ art.dataset.loaded='0'; });

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

    if(loadedSrc!==ASSET.s){
      loadedSrc=ASSET.s;
      img.src=ASSET.s;
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
    const w=Math.max(64,Math.min(104,ur.width*1.65));
    const h=w*(300/228);
    art.style.display='block';
    art.style.left=x+'px';
    art.style.top=y+'px';
    art.style.width=w+'px';
    art.style.height=h+'px';

    const selected=u.classList.contains('selected');
    art.style.transform=`translate(-50%,-96%) scale(${selected?1.10:1})`;
    if(u.classList.contains('acted')) img.style.filter='grayscale(.65) brightness(.58) drop-shadow(0 8px 5px rgba(0,0,0,.7))';
    else if(u.classList.contains('attackable')) img.style.filter='drop-shadow(0 0 8px #ff525f) drop-shadow(0 8px 5px rgba(0,0,0,.7))';
    else if(u.classList.contains('healable')) img.style.filter='drop-shadow(0 0 8px #5fe6a3) drop-shadow(0 8px 5px rgba(0,0,0,.7))';
    else if(selected) img.style.filter='drop-shadow(0 0 7px #e7cd8f) drop-shadow(0 8px 5px rgba(0,0,0,.7))';
    else img.style.filter='drop-shadow(0 8px 5px rgba(0,0,0,.7))';

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
