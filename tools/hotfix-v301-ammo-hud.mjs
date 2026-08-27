import fs from 'node:fs';
const p='src/main.js';
let s=fs.readFileSync(p,'utf8');
const old="function renderBag(){const inv=snap.player.inventory,key=snap.player.bagCapacity+'|'+inv.map(it=>`${it.id}:${it.ammo??''}:${it.reserve??''}`).join(',');";
const neu="function renderBag(){const inv=snap.player.inventory,key=snap.player.bagCapacity+'|'+inv.map(it=>`${it.id}:${it.ammo??''}:${it.qty??''}:${it.tier??''}:${it.ammoTier??''}`).join(',');";
if(!s.includes(old))throw new Error('renderBag cache marker not found');
s=s.replace(old,neu);
fs.writeFileSync(p,s);
