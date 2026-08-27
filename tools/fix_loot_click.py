from pathlib import Path

p = Path('src/main.js')
s = p.read_text(encoding='utf-8')

old = "b.onclick=()=>session?.sendAction({type:ACTIONS.LOOT,itemId:it.id,containerId:c.id});"
new = "b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.LOOT,itemId:it.id,containerId:c.id})};"
if old not in s and new not in s:
    raise SystemExit('loot button target not found')
s = s.replace(old, new, 1)

old = "$('#closeLoot').onclick=()=>session?.sendAction({type:ACTIONS.CLOSE_CONTAINER});"
new = "$('#closeLoot').onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.CLOSE_CONTAINER})};"
if old in s:
    s = s.replace(old, new, 1)

old = "b.onclick=()=>session?.sendAction({type:ACTIONS.EQUIP_BAG,slot:i});"
new = "b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();session?.sendAction({type:ACTIONS.EQUIP_BAG,slot:i})};"
if old in s:
    s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
print('patched loot pointer handling')
