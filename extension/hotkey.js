/* Convert recorded keys to Firefox commands.update syntax. API validates final choice. */
globalThis.SlipframeHotkey={
  fromEvent(e){
    if(['Control','Alt','Shift','Meta','AltGraph'].includes(e.key))return null;
    const aliases={' ':'Space',ArrowUp:'Up',ArrowDown:'Down',ArrowLeft:'Left',ArrowRight:'Right',',':'Comma','.':'Period'};
    let key=aliases[e.key]||e.key;
    if(/^Key[A-Z]$/.test(e.code))key=e.code.slice(3);
    else if(/^Digit[0-9]$/.test(e.code))key=e.code.slice(5);
    else if(key.length===1)key=key.toUpperCase();
    const parts=[];if(e.ctrlKey)parts.push('Ctrl');if(e.metaKey)parts.push('Command');if(e.altKey)parts.push('Alt');if(e.shiftKey)parts.push('Shift');
    return [...parts,key].join('+');
  }
};
