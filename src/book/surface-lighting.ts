import {
  DataTexture, RGBAFormat, UnsignedByteType, LinearMipmapLinearFilter,
  LinearFilter, NoColorSpace, RectAreaLight,
  type MeshPhysicalMaterial, type WebGLRenderer, type Scene,
  type HemisphereLight, type DirectionalLight,
} from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import type { SurfaceMap } from './surface-map';

// The derivative frame follows the existing curled sheet, including its reverse.
const surfaceGLSL = /* glsl */`
uniform sampler2D uSurfaceFront;
uniform sampler2D uSurfaceBack;
vec3 surfaceMappedNormal(vec3 N, vec3 eye, vec2 uv, vec2 encoded) {
  vec3 q0 = dFdx(eye), q1 = dFdy(eye);
  vec2 st0 = dFdx(uv), st1 = dFdy(uv);
  vec3 q1perp = cross(q1, N), q0perp = cross(N, q0);
  vec3 T = q1perp * st0.x + q0perp * st1.x;
  vec3 B = q1perp * st0.y + q0perp * st1.y;
  float scale = inversesqrt(max(max(dot(T,T),dot(B,B)),1e-12));
  vec2 xy = encoded * 2.0 - 1.0;
  return normalize(mat3(T*scale,B*scale,N) * vec3(xy,sqrt(max(1.0-dot(xy,xy),0.0))));
}
`;
export function createSurfaceLighting(
  maps:SurfaceMap[]|undefined, renderer:WebGLRenderer, scene:Scene,
  fill:HemisphereLight, key:DirectionalLight, initialAngle=22,
) {
  if(!maps?.length)return undefined;
  RectAreaLightUniformsLib.init();
  const textures=maps.map(m=>{
    const t=new DataTexture(m.data,m.width,m.height,RGBAFormat,UnsignedByteType);
    t.colorSpace=NoColorSpace;
    // Rows were stored in UV order, independently of DOM color-image uploads.
    t.flipY=false;t.generateMipmaps=true;
    t.minFilter=LinearMipmapLinearFilter;t.magFilter=LinearFilter;
    t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    t.needsUpdate=true;return t;
  });
  const blank=new DataTexture(new Uint8Array([128,128,232,0]),1,1);
  blank.colorSpace=NoColorSpace;blank.needsUpdate=true;
  // This is an actual rectangular emitter evaluated by Three's PBR lighting.
  // Nothing resembling its reflection is painted into the color pages.
  const light=new RectAreaLight('#fff5e6',4.5,2.2,.65);
  scene.add(light);
  fill.intensity=1.15;key.intensity=1.25;
  const setAngle=(degrees:number)=>{
    const angle=Math.max(-65,Math.min(65,degrees))*Math.PI/180;
    light.position.set(Math.sin(angle)*3,.35,Math.cos(angle)*3);
    light.lookAt(0,0,0);
    // Keep shadows readable while the reflection light moves independently.
  };
  setAngle(initialAngle);
  return {
    setAngle,
    bind(material:MeshPhysicalMaterial,front:number,back:number){
      material.metalness=0;material.roughness=.9;material.clearcoat=1;
      const original=material.onBeforeCompile;
      material.onBeforeCompile=function(shader,render){
        original.call(this,shader,render);
        shader.uniforms.uSurfaceFront={value:textures[front]??blank};
        shader.uniforms.uSurfaceBack={value:textures[back]??blank};
        shader.fragmentShader=surfaceGLSL+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('void main() {',`void main() {
          vec2 surfaceUv = gl_FrontFacing ? vGrainUv : vec2(1.0-vGrainUv.x,vGrainUv.y);
          vec4 surfaceData = gl_FrontFacing ? texture2D(uSurfaceFront,surfaceUv) : texture2D(uSurfaceBack,surfaceUv);
          float surfacePhoto = 1.0 - smoothstep(0.12,0.22,abs(surfaceData.a-0.5));
          float surfaceTape = smoothstep(0.75,0.95,surfaceData.a);
        `);
        // Disable the old ink-darkness heuristic: a black drawing is not metal.
        shader.fragmentShader=shader.fragmentShader.replace(
          '#include <metalnessmap_fragment>',
          '#include <metalnessmap_fragment>\nmetalnessFactor = 0.0;',
        ).replace('#include <normal_fragment_maps>',`
          normal = surfaceMappedNormal(normal,-vViewPosition,surfaceUv,surfaceData.rg);
          roughnessFactor = surfaceData.b;
        `).replace('#include <clearcoat_normal_fragment_begin>',`
          #ifdef USE_CLEARCOAT
            vec3 clearcoatNormal = normal;
          #endif
        `).replace('#include <lights_physical_fragment>',`
          #include <lights_physical_fragment>
          #ifdef USE_CLEARCOAT
            material.clearcoat = 0.65 * surfacePhoto + 0.95 * surfaceTape;
            material.clearcoatRoughness = mix(0.16,clamp(surfaceData.b * 0.65,0.075,0.15),surfaceTape);
          #endif
        `);
        // The original grain darkening stays confined to the matte page.
        shader.fragmentShader=shader.fragmentShader.replace(
          'pattern * TEXTURE_COLOR',
          'pattern * TEXTURE_COLOR * (1.0-max(surfacePhoto,surfaceTape))',
        );
        shader.fragmentShader=shader.fragmentShader.replace(
          'sheetColor.rgb *= mix(vec3(1.0), otherColor.rgb, PAPER_TRANSPARENCY);',
          'sheetColor.rgb *= mix(vec3(1.0), otherColor.rgb, PAPER_TRANSPARENCY * (1.0-max(surfacePhoto,surfaceTape)));',
        );
      };
      material.customProgramCacheKey=()=> 'scrapbook-pbr-surface-v2';
      material.needsUpdate=true;
    },
    dispose(){for(const t of textures)t.dispose();blank.dispose();scene.remove(light);light.dispose();},
  };
}
