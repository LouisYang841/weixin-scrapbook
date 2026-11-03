/** Linear data, not an illustration: RG = tangent-space normal XY,
 * B = perceptual roughness, A = coating (paper 0 / photo .5 / tape 1).
 * A single 512px map per page keeps the GPU cost small on phones. */
export interface SurfaceMap { width: number; height: number; data: Uint8Array<ArrayBuffer>; }
export interface SurfacePatch {
  x: number; y: number; width: number; height: number; angle: number;
}
export function photoSurface(x:number,y:number,w:number,h:number,angle:number):SurfacePatch {
  return {x:x+w/2,y:y+h/2,width:w,height:h,angle};
}
const clamp = (x:number,a:number,b:number) => Math.max(a,Math.min(b,x));
const noise = (x:number,y:number) => {
  const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);
};
export function makeSurfaceMap(patches:SurfacePatch[], width=512):SurfaceMap {
  const height=Math.round(width*1.377), data=new Uint8Array(width*height*4);
  // Inverse transforms exactly match the original Canvas photo and tape placement.
  const transforms=patches.map(p=>({...p,cos:Math.cos(p.angle),sin:Math.sin(p.angle)}));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const px=(x+.5)/width*1000,py=(y+.5)/height*1377;
    const grain=noise(x,y)-.5;
    let nx=grain*.045,ny=(noise(x+73,y)-.5)*.045,roughness=.91+grain*.06,coating=0;
    for(const p of transforms){
      const dx=px-p.x,dy=py-p.y;
      const u=dx*p.cos+dy*p.sin,v=-dx*p.sin+dy*p.cos;
      if(u>=-p.width/2-15&&u<=p.width/2+15&&v>=-p.height/2-15&&v<=p.height/2+67){
        const s=(u+p.width/2+15)/(p.width+30),t=(v+p.height/2+15)/(p.height+82);
        // A very gentle real normal variation bends the reflected light only.
        let localX=.055*Math.sin(s*Math.PI*2)+grain*.004;
        let localY=.018*Math.sin(t*Math.PI*2);
        const edge=Math.min(s,1-s,t,1-t);
        const rim=clamp((.012-edge)/.012,0,1);
        localX+=Math.sign(s-.5)*rim*.13;
        localY+=Math.sign(t-.5)*rim*.13;
        nx=localX*p.cos-localY*p.sin;ny=localX*p.sin+localY*p.cos;
        roughness=.24+grain*.012;coating=.5;
      }
      // Original tape is nested inside the photo's rotation, with a slight turn.
      const tapeV=v+p.height/2+12,ta=-p.angle*.4;
      const tu=u*Math.cos(ta)+tapeV*Math.sin(ta);
      const tv=-u*Math.sin(ta)+tapeV*Math.cos(ta);
      // Test the same quadrilateral as the untouched tape artwork.
      const top=-23-(tu+85)*3/167,bottom=26-(tu+80)*4/157;
      if(tu>=-85+clamp((tv+23)/49,0,1)*5&&tu<=82-clamp((tv+26)/48,0,1)*5&&tv>=top&&tv<=bottom){
        const s=(tu+85)/167,t=(tv+26)/52;
        const theta=p.angle+ta;
        // Folds and fibrous grain alter the light, not the image's color.
        const fold=Math.sin(tu*.17+Math.sin(tv*.09))*.09;
        const localX=fold+.06*Math.cos(s*Math.PI*2);
        const localY=.09*Math.sin(t*Math.PI*2)+(noise(x+19,y)-.5)*.022;
        nx=localX*Math.cos(theta)-localY*Math.sin(theta);
        ny=localX*Math.sin(theta)+localY*Math.cos(theta);
        roughness=.42+grain*.035;coating=1;
      }
    }
    // Store bottom row first for a linear DataTexture (no DOM image flip).
    const offset=((height-1-y)*width+x)*4;
    const length=Math.sqrt(1+nx*nx+ny*ny);
    data[offset]=Math.round((nx/length*.5+.5)*255);
    // Canvas Y points down; tangent-space UV Y points up.
    data[offset+1]=Math.round((-ny/length*.5+.5)*255);
    data[offset+2]=Math.round(clamp(roughness,0,1)*255);
    data[offset+3]=Math.round(coating*255);
  }
  return {width,height,data};
}
