// Small sculpted objects, sampled as surfaces for the document glyph renderer.
// Positions use y up and z toward the viewer. All motion is continuous and reversible.
const docSceneTau = Math.PI * 2;
const docSceneClamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function docSceneRotation(ax, ay, az, matrix) {
 const sx = Math.sin(ax), cx = Math.cos(ax), sy = Math.sin(ay), cy = Math.cos(ay), sz = Math.sin(az), cz = Math.cos(az);
 matrix[0] = cz * cy; matrix[1] = cz * sy * sx - sz * cx; matrix[2] = cz * sy * cx + sz * sx;
 matrix[3] = sz * cy; matrix[4] = sz * sy * sx + cz * cx; matrix[5] = sz * sy * cx - cz * sx;
 matrix[6] = -sy; matrix[7] = cy * sx; matrix[8] = cy * cx;
 return matrix;
}

function docScenePoint(matrix, emit, x, y, z, nx, ny, nz, tone, accent = 0) {
 emit(matrix[0] * x + matrix[1] * y + matrix[2] * z, matrix[3] * x + matrix[4] * y + matrix[5] * z, matrix[6] * x + matrix[7] * y + matrix[8] * z,
  matrix[0] * nx + matrix[1] * ny + matrix[2] * nz, matrix[3] * nx + matrix[4] * ny + matrix[5] * nz, matrix[6] * nx + matrix[7] * ny + matrix[8] * nz, tone, accent);
}

function docSceneMesh(mesh, matrix, emit, tx = 0, ty = 0, tz = 0, material = 1, ink = 0) {
 for (let i = 0; i < mesh.length; i += 8) docScenePoint(matrix, emit, mesh[i] + tx, mesh[i + 1] + ty, mesh[i + 2] + tz,
  mesh[i + 3], mesh[i + 4], mesh[i + 5], mesh[i + 6] * material, Math.max(mesh[i + 7], ink));
}

function docSceneSphere(radius, count, tone = 1) {
 const points = new Float32Array(count * 8), golden = Math.PI * (3 - Math.sqrt(5));
 for (let i = 0; i < count; i++) {
  const y = 1 - 2 * (i + 0.5) / count, r = Math.sqrt(1 - y * y), angle = golden * i, x = Math.cos(angle) * r, z = Math.sin(angle) * r, o = i * 8;
  points.set([x * radius, y * radius, z * radius, x, y, z, tone, 0], o);
 }
 return points;
}

function docSceneTorus(radius, tube, around = 112, across = 12, tone = 0.9) {
 const points = new Float32Array(around * across * 8);
 for (let u = 0; u < around; u++) for (let v = 0; v < across; v++) {
  const a = u / around * docSceneTau, b = v / across * docSceneTau, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), o = (u * across + v) * 8;
  points.set([(radius + tube * cb) * ca, (radius + tube * cb) * sa, tube * sb, ca * cb, sa * cb, sb, tone, 0], o);
 }
 return points;
}

function docScenePreferences(phase) {
 const rings = [docSceneTorus(0.98, 0.062), docSceneTorus(0.75, 0.058), docSceneTorus(0.51, 0.055)];
 const matrices = rings.map(() => new Float32Array(9)), center = docSceneSphere(0.155, 240, 0.8), bead = docSceneSphere(0.09, 144, 1);
 const ticks = [];
 // Engraved calibrations remain attached to the outer brass-like ring.
 for (let tick = 0; tick < 32; tick++) for (let step = 0; step < 6; step++) {
  const a = tick / 32 * docSceneTau, r = 0.936 + step * (tick % 4 ? 0.008 : 0.014);
  ticks.push(r * Math.cos(a), r * Math.sin(a), 0.058, 0, 0, 1, tick % 4 ? 0.45 : 1, tick === 0 ? 0.4 : 0);
 }
 const marks = new Float32Array(ticks);
 return (time, emit, intensity = 0) => {
  const t = time + phase;
  docSceneRotation(0.58 + 0.09 * Math.sin(t * 0.17), 0.16 * Math.sin(t * 0.12), 0.18, matrices[0]);
  docSceneRotation(1.11 + 0.18 * Math.sin(t * 0.19), 0.3, 0.45 + t * 0.12, matrices[1]);
  docSceneRotation(0.35 * Math.cos(t * 0.14), 1.08, -0.5 - t * 0.105, matrices[2]);
  for (let i = 0; i < rings.length; i++) docSceneMesh(rings[i], matrices[i], emit);
  docSceneMesh(marks, matrices[0], emit);
  docSceneMesh(center, matrices[2], emit);
  const a = t * 0.19 + 0.4;
  docSceneMesh(bead, matrices[0], emit, Math.cos(a) * 0.98, Math.sin(a) * 0.98, 0, 1, 0.55 + intensity * 0.2);
 };
}

function docSceneProfile(phase) {
 const globe = docSceneSphere(0.94, 4700), matrix = new Float32Array(9), orbitMatrix = new Float32Array(9);
 const orbit = docSceneTorus(1.075, 0.012, 144, 4, 0.38), bead = docSceneSphere(0.045, 80, 0.95);
 // A continuous spherical field gives each identity its own raised archipelagos.
 // Longitude wraps exactly, so there is no seam when the globe turns.
 for (let i = 0; i < globe.length; i += 8) {
  const x = globe[i + 3], y = globe[i + 4], z = globe[i + 5], latitude = Math.asin(y), longitude = Math.atan2(z, x);
  const field = Math.sin(3.2 * x + 2.1 * y - 1.7 * z + phase * 0.04) + 0.63 * Math.sin(5.1 * y + 3.4 * z - x) + 0.35 * Math.sin(8.8 * x - 4.9 * z + y);
  const land = docSceneClamp((field - 0.13) * 2.3), contour = Math.abs(Math.sin(field * 7.5)) < 0.13;
  const grid = Math.abs(Math.sin(latitude * 8)) < 0.055 || Math.abs(Math.sin(longitude * 10)) * Math.cos(latitude) < 0.045;
  const radius = 0.94 + land * 0.025;
  globe[i] = x * radius; globe[i + 1] = y * radius; globe[i + 2] = z * radius;
  globe[i + 6] = grid ? 0.52 : land > 0.05 ? (contour ? 0.94 : 0.42 + land * 0.33) : 0.11;
 }
 return (time, emit, intensity = 0) => {
  const t = time + phase;
  docSceneRotation(-0.18, t * 0.105 + 0.6, -0.14, matrix);
  docSceneRotation(1.02, 0.28, -0.34, orbitMatrix);
  docSceneMesh(globe, matrix, emit);
  docSceneMesh(orbit, orbitMatrix, emit);
  const a = t * 0.21;
  docSceneMesh(bead, orbitMatrix, emit, 1.075 * Math.cos(a), 1.075 * Math.sin(a), 0, 1, 0.65 + 0.2 * intensity);
 };
}

function docSceneFace(phase) {
 const matrix=new Float32Array(9),surface=[],support=[];
 const gaussian=(x,y,cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));
 // A shaped face, with recessed sockets, a raised nose, cheekbones and lips.
 // Normals come from the surface itself, so the features catch the shared light.
 const depth=(x,y)=>{
  const v=(y-.16)/.86,w=.62*(1-.14*docSceneClamp(-v));
  const shell=.37*Math.sqrt(Math.max(.0001,1-(x/w)**2-v*v));
  return .12+shell+.14*gaussian(x,y,0,.19,.085,.29)+.16*gaussian(x,y,0,-.065,.115,.1)
   -.075*(gaussian(x,y,-.235,.27,.155,.085)+gaussian(x,y,.235,.27,.155,.085))
   +.05*(gaussian(x,y,-.31,.005,.15,.15)+gaussian(x,y,.31,.005,.15,.15))
   +.035*gaussian(x,y,0,-.295,.2,.055)+.05*gaussian(x,y,0,-.51,.23,.13);
 };
 for(let row=0;row<73;row++)for(let col=0;col<67;col++){
  const x=(col/66*2-1)*.63,y=-.7+row/72*1.72,v=(y-.16)/.86,w=.62*(1-.14*docSceneClamp(-v));
  if((x/w)**2+v*v>.997)continue;
  const z=depth(x,y),nx=-(depth(x+.002,y)-depth(x-.002,y))/.004,ny=-(depth(x,y+.002)-depth(x,y-.002))/.004,norm=Math.hypot(nx,ny,1);
  const side=Math.sign(x)||1,ex=(x-side*.235)/.125,ey=y-.265;
  const hairline=.705+.065*Math.sin(x*5+.6),hair=y>hairline||(Math.abs(x)>.53&&y>.29);
  const eyebrow=Math.abs(ex)<1.15&&Math.abs(y-(.375+.035*(1-ex*ex)))<.017;
  const nostril=gaussian(x,y,side*.085,-.115,.038,.024)>.45;
  let tone=hair?.81+.13*(.5+.5*Math.sin(x*34+y*13)):eyebrow||nostril?.97:.43;
  if(!hair&&Math.abs(x)<.225&&Math.abs(y+.3)<.055)tone=.59;
  const eye=!hair&&Math.abs(ex)<1&&Math.abs(ey)<.066;
  const mouth=Math.abs(x)<.21&&Math.abs(y+.315)<.08;
  surface.push(x,y,z,nx/norm,ny/norm,1/norm,tone,eye?1:mouth?2:0,ex,ey);
 }
 // The ears, back of the head and neck give the portrait a physical silhouette.
 const ellipsoid=(cx,cy,cz,rx,ry,rz,count,tone)=>{
  const sphere=docSceneSphere(1,count);
  for(let i=0;i<sphere.length;i+=8){
   const x=sphere[i],y=sphere[i+1],z=sphere[i+2],nx=x/rx,ny=y/ry,nz=z/rz,norm=Math.hypot(nx,ny,nz);
   support.push(cx+x*rx,cy+y*ry,cz+z*rz,nx/norm,ny/norm,nz/norm,tone,0);
  }
 };
 ellipsoid(0,.17,-.005,.60,.84,.37,720,.53);
 ellipsoid(-.61,.095,.055,.103,.195,.105,180,.46);ellipsoid(.61,.095,.055,.103,.195,.105,180,.46);
 ellipsoid(0,-.79,-.045,.185,.255,.19,240,.36);
 ellipsoid(0,-1.04,-.095,.62,.19,.29,420,.39);
 const face=new Float32Array(surface),bust=new Float32Array(support);
 return (time,emit,intensity=0)=>{
  const t=time+phase,blinkAt=(t+1.7)%5.6;
  const blink=blinkAt<.22?Math.sin(blinkAt/.22*Math.PI):0;
  const phrase=(t+.4)%7.8,speech=phrase<3.4?Math.sin(phrase*Math.PI/3.4)**2:0;
  const opening=.008+speech*(.015+.026*Math.sin(t*5.2)**2),gaze=.08*Math.sin(t*.27);
  docSceneRotation(.035*Math.sin(t*.39),-.12+.17*Math.sin(t*.23),.025*Math.sin(t*.19),matrix);
  docSceneMesh(bust,matrix,emit);
  for(let i=0;i<face.length;i+=10){
   const x=face[i],y=face[i+1],region=face[i+7],ex=face[i+8],ey=face[i+9];
   let tone=face[i+6],accent=0,z=face[i+2];
   if(region===1){
    const lid=.038*(1-blink)*Math.sqrt(Math.max(0,1-ex*ex));
    const line=.008*ex*ex;
    if(Math.abs(ey-line)<lid)tone=Math.abs(ex-gaze)<.31?.98:.085;
    else if(Math.abs(ey-line-lid)<.012)tone=.88;
   }else if(region===2){
    const lip=Math.sqrt(Math.max(0,1-(x/.21)**2)),center=-.315+.027*(x/.21)**2;
    if(Math.abs(y-center)<opening*lip){tone=.98;z-=.025;}
    else if(Math.abs(y-center+opening*lip)<.017&&Math.abs(x)<.17){tone=.68;accent=intensity*.55;}
   }
   docScenePoint(matrix,emit,x,y,z,face[i+3],face[i+4],face[i+5],tone,accent);
  }
 };
}

function docSceneVoice(phase) {
 const countU = 170, countV = 25, coordinates = new Float32Array(countU * countV * 2), matrix = new Float32Array(9);
 let offset = 0;
 for (let i = 0; i < countU; i++) for (let j = 0; j < countV; j++) {
  coordinates[offset++] = i / (countU - 1) * 2 - 1;
  coordinates[offset++] = j / (countV - 1) * 2 - 1;
 }
 return (time, emit, intensity = 0) => {
  const t = time + phase, wave = t * 0.34, twistTime = t * 0.13;
  docSceneRotation(0.12, -0.2, -0.12, matrix);
  // The cross section rolls along a travelling wave. Its actual surface normal
  // is the cross product of the analytic lengthwise and crosswise tangents.
  for (let i = 0; i < coordinates.length; i += 2) {
   const u = coordinates[i], v = coordinates[i + 1], envelope = 0.78 + 0.22 * Math.cos(u * Math.PI * 0.5);
   const angle = u * Math.PI * 2.1 - wave, bend = u * Math.PI * 0.85 + twistTime;
   const twist = 0.7 * Math.sin(bend), ct = Math.cos(twist), st = Math.sin(twist), width = 0.17 + 0.045 * Math.cos(u * Math.PI);
   const waveHeight = 0.39 + intensity * 0.025;
   const x = u * 1.12, y = waveHeight * Math.sin(angle) * envelope + v * width * ct;
   const z = 0.23 * Math.cos(u * Math.PI * 1.05 - wave * 0.5) + v * width * st;
   const dEnvelope = -0.11 * Math.PI * Math.sin(u * Math.PI * 0.5), dWidth = -0.045 * Math.PI * Math.sin(u * Math.PI);
   const dTwist = 0.7 * Math.PI * 0.85 * Math.cos(bend);
   const dy = waveHeight * (Math.PI * 2.1 * Math.cos(angle) * envelope + Math.sin(angle) * dEnvelope) + v * (dWidth * ct - width * st * dTwist);
   const dz = -0.23 * Math.PI * 1.05 * Math.sin(u * Math.PI * 1.05 - wave * 0.5) + v * (dWidth * st + width * ct * dTwist);
   const nx = dy * st - dz * ct, ny = -1.12 * st, nz = 1.12 * ct, length = Math.hypot(nx, ny, nz);
   const edge = Math.abs(v) > 0.91, rib = Math.abs(Math.sin(u * Math.PI * 13)) < 0.14;
   const pulse = Math.exp(-Math.pow((u - Math.sin(t * 0.19) * 0.9) / 0.1, 2));
   docScenePoint(matrix, emit, x, y, z, nx / length, ny / length, nz / length, edge ? 1 : rib ? 0.69 : 0.46 + 0.25 * (1 - Math.abs(v)), edge ? pulse * 0.75 : 0);
  }
 };
}

function docSceneFormats(phase) {
 const planes = [], matrix = new Float32Array(9), columns = 33, rows = 49;
 for (let layer = 0; layer < 3; layer++) {
  const points = [];
  for (let i = 0; i < columns; i++) for (let j = 0; j < rows; j++) {
   const x = (i / (columns - 1) * 2 - 1) * 0.43, y = (j / (rows - 1) * 2 - 1) * 0.73;
   const rounded = Math.hypot(Math.max(0, Math.abs(x) - 0.375), Math.max(0, Math.abs(y) - 0.675));
   if (rounded > 0.055) continue;
   // The side perforations are empty space, not a dark texture on a rectangle.
   const perforation = Math.abs(x) > 0.335 && Math.abs(x) < 0.397 && Math.abs(Math.sin((y + 0.7) * Math.PI / 0.145)) > 0.63;
   if (perforation) continue;
   const rim = Math.abs(x) > 0.315 || Math.abs(y) > 0.63;
   const frameLine = Math.abs(y - 0.13) < 0.035 || Math.abs(y + 0.42) < 0.03;
   let tone = rim ? 0.93 : frameLine ? 0.72 : 0.16;
   if (!rim && y > 0.2 && y < 0.57) {
    const ridge = 0.29 + 0.13 * Math.sin(x * 7 + layer * 0.9);
    tone = y < ridge ? 0.42 : 0.11;
   }
   if (!rim && y < 0.06 && y > -0.34) {
    const triangle = x > -0.085 && x < 0.13 && Math.abs(y + 0.15) < (0.13 - x) * 0.65;
    tone = triangle ? 0.84 : 0.14;
   }
   const edge = Math.max(Math.abs(x) / 0.43, Math.abs(y) / 0.73), bevel = docSceneClamp((edge - 0.925) / 0.075);
   const nx = x / 0.43 * bevel * 0.65, ny = y / 0.73 * bevel * 0.65, nz = 1, norm = Math.hypot(nx, ny, nz);
   points.push(x, y, 0.048 * (1 - bevel), nx / norm, ny / norm, nz / norm, tone, layer === 2 && y < -0.53 && y > -0.58 && x < 0.06 ? 0.5 : 0);
  }
  planes.push(new Float32Array(points));
 }
 return (time, emit, intensity = 0) => {
  const t = time + phase;
  for (let layer = 0; layer < 3; layer++) {
   const spread = layer - 1;
   docSceneRotation(0.07 + Math.sin(t * 0.17 + layer * 0.4) * 0.025, -0.32 + spread * 0.11, spread * -0.10 - 0.02, matrix);
   docSceneMesh(planes[layer], matrix, emit, spread * (0.37 + intensity * 0.04), spread * 0.09 + Math.sin(t * 0.2 + layer * 0.6) * 0.025, spread * 0.29);
  }
 };
}

function docSceneTrialReels(phase) {
 const glass=[],liquid=[],marks=[],matrix=new Float32Array(9),bubble=docSceneSphere(1,112,.72);
 const radius=y=>y>.48?.185:y>-.64?.185+(.48-y)*.51:.756-(y+.64)**2*1.25;
 for(let row=0;row<46;row++){
  const y=-.83+row/45*1.79,r=radius(y),slope=(radius(y+.001)-radius(y-.001))/.002,norm=Math.hypot(1,slope);
  for(let col=0;col<96;col++){
   const a=col/96*docSceneTau,c=Math.cos(a),s=Math.sin(a);
   // The front is open glass: only its thick edges meet the depth buffer.
   // Liquid and bubbles stay visible through the middle of the flask.
   if(s<0||Math.abs(s)<.22)glass.push(r*c,y,r*s,c/norm,-slope/norm,s/norm,Math.abs(s)<.22?.86:.10,0);
  }
 }
 const lip=docSceneTorus(.205,.045,72,8,.96),base=docSceneTorus(.71,.045,80,6,.72);
 for(const [ring,y] of [[lip,.965],[base,-.827]])for(let i=0;i<ring.length;i+=8)glass.push(ring[i],y+ring[i+2],ring[i+1],ring[i+3],ring[i+5],ring[i+4],ring[i+6],0);
 for(let row=0;row<16;row++){
  const y=-.78+row/15*.44,r=radius(y)-.055;
  for(let col=0;col<72;col++){
   const a=col/72*docSceneTau,c=Math.cos(a),s=Math.sin(a);if(s<0)continue;
   const play=s>.88&&Math.abs(y+.555)<(.13-r*c)*.75&&r*c>-.11&&r*c<.13;
   const norm=Math.hypot(1,.51);
   liquid.push(r*c,y,r*s,c/norm,.51/norm,s/norm,play?.1:.49,0);
  }
 }
 // A shallow elliptical surface, with a continuous travelling ripple.
 const surface=[];
 for(let row=1;row<=14;row++)for(let col=0;col<64;col++){
  const a=col/64*docSceneTau,r=(radius(-.34)-.055)*row/14;
  surface.push(Math.cos(a)*r,Math.sin(a)*r,row===14?1:.57);
 }
 for(let line=0;line<5;line++)for(let i=0;i<10;i++){
  const y=-.48+line*.16,x=.26+i*(line%2?.008:.012),r=radius(y);if(x>=r)continue;
  marks.push(x,y,Math.sqrt(r*r-x*x)+.012,0,0,1,.83,line===2?.6:0);
 }
 const shell=new Float32Array(glass),fluid=new Float32Array(liquid),ticks=new Float32Array(marks);
 return (time,emit,intensity=0)=>{
  const t=time+phase;
  docSceneRotation(.15,-.23+.055*Math.sin(t*.24),.035*Math.sin(t*.3),matrix);
  docSceneMesh(shell,matrix,emit);docSceneMesh(fluid,matrix,emit);
  for(let i=0;i<surface.length;i+=3){
   const x=surface[i],z=surface[i+1],a=x*5+z*3+t*.72,dy=.016*Math.sin(a),nx=-.08*Math.cos(a),nz=-.048*Math.cos(a),norm=Math.hypot(nx,1,nz);
   docScenePoint(matrix,emit,x,-.34+dy,z,nx/norm,1/norm,nz/norm,surface[i+2],surface[i+2]===1?.52:0);
  }
  for(let b=0;b<3;b++){
   const p=(t*.16+b/3)%1,r=(.047+b*.008)*Math.sin(p*Math.PI),x=Math.sin(t*.7+b*2)*(.12*(1-p)),y=-.31+p*.98;
   for(let i=0;i<bubble.length;i+=8)docScenePoint(matrix,emit,x+bubble[i]*r,y+bubble[i+1]*r,.10+bubble[i+2]*r,bubble[i+3],bubble[i+4],bubble[i+5],.70+intensity*.1,b===0?.58:0);
  }
  docSceneMesh(ticks,matrix,emit);
 };
}

function docSceneQuickCuts(phase) {
 const metal=[],handle=[],stem=[],film=[],matrix=new Float32Array(9),partMatrix=new Float32Array(9),pivot=docSceneSphere(.105,160,.95);
 for(let row=0;row<38;row++)for(let col=0;col<15;col++)for(const face of [-1,1]){
  const u=row/37,y=u*1.045,x=(col/14*2-1)*(.115*(1-u)+.014),bevel=Math.abs(col/14*2-1),nx=Math.sign(x)*bevel*.7,nz=face,norm=Math.hypot(nx,nz);
  metal.push(x,y,face*.031*(1-bevel*.55),nx/norm,0,nz/norm,bevel>.8?.97:.57,0);
 }
 // Real holes in elliptical handles, with a round cross section for light.
 for(let col=0;col<72;col++)for(let row=0;row<10;row++){
  const a=col/72*docSceneTau,b=row/10*docSceneTau,c=Math.cos(a),s=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
  handle.push(-.18+c*(.205+.046*cb),-.61+s*(.275+.046*cb),.046*sb,c*cb,s*cb,sb,.84,0);
 }
 for(let row=0;row<26;row++)for(let col=0;col<8;col++){
  const u=row/25,a=col/8*docSceneTau,c=Math.cos(a),s=Math.sin(a);
  stem.push(-.10*u+.055*c,-.36*u,.055*s,c,0,s,.70,0);
 }
 for(let col=0;col<42;col++)for(let row=0;row<13;row++){
  const x=.012+col/41*1.025,y=.37+row/12*.28,edge=row<2||row>10;
  if(edge&&Math.sin(x*Math.PI/.145)>.30)continue;
  const frame=Math.abs(Math.sin(x*Math.PI/.36))<.15;
  film.push(x,y,.025,0,0,1,edge?.85:frame?.7:.18,0);
 }
 const blade=new Float32Array(metal),loop=new Float32Array(handle),shaft=new Float32Array(stem),strip=new Float32Array(film);
 return (time,emit,intensity=0)=>{
  const t=time+phase,cycle=(t*.15)%1,close=Math.sin(cycle*Math.PI)**8,angle=.39-.35*close;
  const separation=.025+.15*Math.sin(Math.max(0,cycle-.5)*Math.PI*2)**2;
  docSceneRotation(.10,-.16+.035*Math.sin(t*.19),-.07,matrix);
  for(const side of [-1,1]){
   for(let i=0;i<strip.length;i+=8)docScenePoint(matrix,emit,side*(strip[i]+separation),strip[i+1]-(side===1?separation*.30:0),strip[i+2],0,0,1,strip[i+6],strip[i]<.04?close*.68:0);
   const a=-side*angle,c=Math.cos(a),s=Math.sin(a);
   for(const mesh of [blade,loop,shaft])for(let i=0;i<mesh.length;i+=8){
    const x=mesh[i]*side,y=mesh[i+1],nx=mesh[i+3]*side,ny=mesh[i+4];
    docScenePoint(matrix,emit,x*c-y*s,x*s+y*c,mesh[i+2]+side*.047,nx*c-ny*s,nx*s+ny*c,mesh[i+5],mesh[i+6],0);
   }
  }
  docSceneRotation(.10,-.16,-.07,partMatrix);
  docSceneMesh(pivot,partMatrix,emit,0,0,.13,1,.56+intensity*.1);
 };
}

function docSceneInstructions(phase) {
 const nodes = [], wires = [], matrix = new Float32Array(9), sphere = docSceneSphere(0.098, 132, 0.95);
 const yz = [[0.55, 0], [0, -0.3], [-0.55, 0], [0, 0.3]];
 for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 4; i++) nodes.push({x: (layer - 1) * 0.77, y: yz[i][0], z: yz[i][1], layer});
 for (let layer = 0; layer < 2; layer++) for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
  const from = nodes[layer * 4 + a], to = nodes[(layer + 1) * 4 + b], dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z, length = Math.hypot(dx, dy, dz);
  // A perpendicular frame makes each connection a fine round cable in space.
  const px = -dy / Math.hypot(dx, dy), py = dx / Math.hypot(dx, dy), pz = 0;
  const qx = -dz * py / length, qy = dz * px / length, qz = (dx * py - dy * px) / length;
  wires.push({from, dx, dy, dz, px, py, pz, qx, qy, qz, layer, delay: ((a * 3 + b) % 5) * 0.025});
 }
 return (time, emit, intensity = 0) => {
  const t = time + phase, pass = (t * 0.29) % 3.25;
  docSceneRotation(0.24, 0.42 + 0.13 * Math.sin(t * 0.16), -0.12, matrix);
  for (const wire of wires) {
   const front = pass - wire.layer - wire.delay;
   for (let i = 0; i <= 27; i++) {
    const u = i / 27, trail = front - u, active = trail >= 0 && trail < 0.24, pulse = active ? Math.exp(-trail * 12) : 0;
    for (let j = 0; j < 3; j++) {
     const a = j / 3 * docSceneTau, ca = Math.cos(a), sa = Math.sin(a), nx = wire.px * ca + wire.qx * sa, ny = wire.py * ca + wire.qy * sa, nz = wire.pz * ca + wire.qz * sa;
     docScenePoint(matrix, emit, wire.from.x + wire.dx * u + nx * 0.012, wire.from.y + wire.dy * u + ny * 0.012, wire.from.z + wire.dz * u + nz * 0.012,
      nx, ny, nz, 0.22 + pulse * 0.71, pulse * (0.65 + intensity * 0.15));
    }
   }
  }
  for (const node of nodes) {
   const distance = pass - node.layer, pulse = Math.exp(-distance * distance * 24);
   docSceneMesh(sphere, matrix, emit, node.x, node.y, node.z, 0.72 + 0.28 * pulse, pulse * 0.65);
  }
 };
}

function docSceneDocument(phase) {
 const sheets = [], matrix = new Float32Array(9), columns = 35, rows = 49;
 for (let layer = 0; layer < 3; layer++) {
  const points = [];
  for (let i = 0; i < columns; i++) for (let j = 0; j < rows; j++) {
   const x = (i / (columns - 1) * 2 - 1) * 0.59, y = (j / (rows - 1) * 2 - 1) * 0.73;
   const edge = i === 0 || i === columns - 1 || j === 0 || j === rows - 1;
   const title = y > 0.405 && y < 0.49 && x > -0.42 && x < 0.24;
   const lineIndex = Math.round((0.22 - y) / 0.145), lineY = 0.22 - lineIndex * 0.145;
   const text = lineIndex >= 0 && lineIndex < 5 && x > -0.42 && x < [0.40, 0.27, 0.40, 0.14, 0.34][lineIndex];
   const groove = text ? 0.016 * Math.exp(-Math.pow((y - lineY) / 0.024, 2)) : 0;
   const gradient = groove * 2 * (y - lineY) / (0.024 * 0.024), line = groove > 0.006;
   points.push(x, y, edge ? 0.88 : title ? 0.93 : line ? 0.82 : 0.22, layer === 2 && lineIndex === 4 && line && x > 0.23 ? 0.55 : 0, groove, gradient, edge ? 1 : 0);
  }
  sheets.push(new Float32Array(points));
 }
 return (time, emit, intensity = 0) => {
  const t = time + phase;
  for (let layer = 0; layer < sheets.length; layer++) {
   const sheet = sheets[layer], spread = layer - 1, turn = layer === 2 ? 0.98 + Math.sin(t * 0.3) * 0.10 + intensity * 0.08 : 0.12 + layer * 0.15;
   // The sheets fan from a shared lower spine. Yaw exposes the gaps between
   // them while the front corner stays visibly rolled throughout its breath.
   docSceneRotation(0.27 + spread * 0.035, 0.35 + spread * 0.055 + Math.sin(t * 0.14) * 0.035, 0.02 - spread * 0.16, matrix);
   for (let i = 0; i < sheet.length; i += 7) {
    const u = sheet[i], v = sheet[i + 1], diagonal = Math.max(0, (u + v - 0.38) / Math.SQRT2), radius = 0.30, angle = diagonal / radius * turn, sa = Math.sin(angle), ca = Math.cos(angle);
    // Roll the corner around a diagonal cylinder. Arc length is preserved,
    // so its edge folds into space like paper instead of stretching like cloth.
    const pull = (diagonal - radius / turn * sa) / Math.SQRT2, groove = sheet[i + 4], gradient = sheet[i + 5];
    const x = u - pull + spread * (0.22 + intensity * 0.018) + groove * sa / Math.SQRT2, y = v - pull + spread * 0.035 + groove * sa / Math.SQRT2;
    const z = radius / turn * (1 - ca) + spread * 0.205 + Math.sin(t * 0.24 + layer * 0.3) * 0.012 - groove * ca;
    // Text is cut into the paper: the narrow grooves have their own normals.
    const nx = -sa / Math.SQRT2 - gradient * (ca - 1) / 2, ny = -sa / Math.SQRT2 - gradient * (ca + 1) / 2, nz = ca - gradient * sa / Math.SQRT2, norm = Math.hypot(nx, ny, nz);
    const curl = layer === 2 ? docSceneClamp(angle / 1.5) : 0, tone = Math.max(sheet[i + 2], curl * 0.57);
    docScenePoint(matrix, emit, x, y, z, nx / norm, ny / norm, nz / norm, tone * (0.90 + layer * 0.05), sheet[i + 3]);
    if (sheet[i + 6]) {
     const ex = Math.abs(u) > 0.58 ? Math.sign(u) : 0, ey = Math.abs(v) > 0.72 ? Math.sign(v) : 0, edgeNorm = Math.hypot(ex, ey);
     const d = (ex + ey) / Math.SQRT2 / edgeNorm, c = (ex - ey) / Math.SQRT2 / edgeNorm;
     docScenePoint(matrix, emit, x + 0.018 * sa / Math.SQRT2, y + 0.018 * sa / Math.SQRT2, z - 0.018 * ca,
      (d * ca + c) / Math.SQRT2, (d * ca - c) / Math.SQRT2, d * sa, 0.86, 0);
    }
   }
  }
 };
}

export function createDocumentScene(kind, seed = 0) {
 const value = Number.isFinite(Number(seed)) ? Math.abs(Number(seed)) : 0;
 const phase = (value < 1 ? value : (value % 997) / 997) * docSceneTau;
 const make = {preferences: docScenePreferences, profile: docSceneProfile, face: docSceneFace, 'trial-reels': docSceneTrialReels, 'quick-cuts': docSceneQuickCuts, voice: docSceneVoice, formats: docSceneFormats, instructions: docSceneInstructions, document: docSceneDocument}[kind] || docSceneDocument;
 return make(phase);
}
