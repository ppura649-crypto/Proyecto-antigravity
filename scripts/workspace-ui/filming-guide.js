// Shared filming illustrations, with instructions fitted to each format.
export function filmingGuide(ui,format='phone') {
 const list=format==='scroll-reel',id=list?'list-filming-title':'shot-filming-title';
 const examples=[
  ['street','Walk outside',list?'Keep the phone steady and yourself in the shot.':'Walk past the phone or have someone film you.'],
  ['desk','Work at your desk','Type or write with your face in the frame.'],
  ['coffee','Take a coffee break','Sip your drink or look out of the window.'],
  ['camera',list?'Keep it simple':'Look at the camera',list?'Sit comfortably and carry on with your day.':'Set the phone down and keep it natural.']
 ];
 return `<section class="filming-guide" aria-labelledby="${id}"><h2 id="${id}">What we need from you</h2><p>${list?'Film a few takes of yourself, about 15 seconds each. Pick the moments that suit you.':'Film yourself for 8 to 12 seconds. Pick any one of these.'}</p><div class="filming-scenes">${examples.map(([scene,title,line])=>`<figure><div class="filming-scene" data-scene="${scene}" role="img" aria-label="${ui.esc(title+': '+line)}"></div><figcaption><strong>${title}</strong><p>${line}</p></figcaption></figure>`).join('')}</div><p class="filming-guide-foot">${list?'Film vertically in good light. Keep yourself visible, with space above for the resources. One continuous take, with no talking or added text.':'Film vertically in good light. Keep yourself visible, with a little space around you. No talking, cuts or added text.'}</p></section>`;
}
