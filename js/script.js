/* js/script.js of parallax-gallery for par-gallery.bauska.org */
if (!window.THREE) console.error("Three.js non chargé");
let layers = [];
const textures = [];
let loaded = 0;
let lastTime = 0;
const DEPTH_LAYERS = 5;
const IMAGES_PER_LAYER = 10;
const MAX_WIDTH = 160;
const MAX_HEIGHT = 160;
let dragActive = !1;
let lastX = 0;
let dragVelocity = 0;
let speedFactor = 1;
const LAYER_CONFIG = [{
  scale: 1.5,
  speed: 80,
  opacity: 1.0
}, {
  scale: 1.0,
  speed: 40,
  opacity: 0.85
}, {
  scale: 0.8,
  speed: 30,
  opacity: 0.7
}, {
  scale: 0.6,
  speed: 20,
  opacity: 0.55
}, {
  scale: 0.5,
  speed: 15,
  opacity: 0.4
}];
const IMAGE_PATHS = ['https://images.unsplash.com/photo-1602353195884-44ea7e76e196?w=200', 'https://images.unsplash.com/photo-1582890158937-c11bebdc387f?w=200', 'https://images.unsplash.com/photo-1583320901261-81b2160ac1eb?w=200', 'https://images.unsplash.com/photo-1583705794539-ac40eb735193?w=200', 'https://images.unsplash.com/photo-1585088316174-42ab5d3a99b2?w=200', 'https://images.unsplash.com/photo-1585612155794-c83acbc99359?w=200', 'https://images.unsplash.com/photo-1588367171393-c0f77a14faff?w=200', 'https://images.unsplash.com/photo-1588501756867-865784321337?w=200', 'https://images.unsplash.com/photo-1588608368947-c243aea32bff?w=200', 'https://images.unsplash.com/photo-1591167068512-e96853b5a458?w=200', 'https://images.unsplash.com/photo-1592926256627-488adc9a24f1?w=200', 'https://images.unsplash.com/photo-1594063596316-aa5f41ceb8dc?w=200', 'https://images.unsplash.com/photo-1595687825617-10c4d36566e7?w=200', 'https://images.unsplash.com/photo-1595796098891-e6adfdc930bd?w=200', 'https://images.unsplash.com/photo-1597426720982-d6d9d73de978?w=200', 'https://images.unsplash.com/photo-1601574465779-76d6dbb88557?w=200', 'https://images.unsplash.com/photo-1605815176963-328929c499cf?w=200', 'https://images.unsplash.com/photo-1610642434561-956cd4111f42?w=200', 'https://images.unsplash.com/photo-1612694790936-e4ac2ef03ec0?w=200', 'https://images.unsplash.com/photo-1623572180554-d8d8d6ba8630?w=200', 'https://images.unsplash.com/photo-1630155848269-94f37474ed8b?w=200', 'https://images.unsplash.com/photo-1740919486071-1650afd5b694?w=200', 'https://images.unsplash.com/photo-1738525052282-900818c83635?w=200', 'https://images.unsplash.com/photo-1715615303987-b1168c876b0a?w=200', 'https://images.unsplash.com/photo-1634545133513-b26b1d79bb34?w=200'];
let shuffledImages = [];
let currentImageIndex = 0;
console.log("&Toc on codepen - https://codepen.io/ol-ivier");

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function getNextRandomImage() {
  if (currentImageIndex >= shuffledImages.length) {
    shuffledImages = shuffleArray(IMAGE_PATHS);
    currentImageIndex = 0
  }
  const image = shuffledImages[currentImageIndex];
  currentImageIndex++;
  return image
}
const container = document.getElementById("container");
const loadingEl = document.getElementById("loading");
const uiEl = document.getElementById("ui");
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({
  antialias: !0,
  alpha: !0,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);
let camera;

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function fallbackTexture(layer) {
  const c = document.createElement("canvas");
  c.width = MAX_WIDTH;
  c.height = MAX_HEIGHT;
  const ctx = c.getContext("2d");
  ctx.fillStyle = ["#4a6572", "#344955", "#232f34", "#1c2529", "#0f1518"][layer];
  ctx.fillRect(0, 0, c.width, c.height);
  return new THREE.CanvasTexture(c)
}
for (let l = 0; l < DEPTH_LAYERS; l++) {
  layers[l] = []
}

function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  renderer.setSize(w, h);
  if (!camera) {
    camera = new THREE.OrthographicCamera(0, w, h, 0, -1000, 1000);
    camera.position.z = 10
  } else {
    camera.right = w;
    camera.top = h;
    camera.updateProjectionMatrix()
  }
  for (const layer of layers) {
    if (!layer) continue;
    for (const s of layer) {
      scene.remove(s);
      if (s.material.map) s.material.map.dispose();
      s.material.dispose();
      s.geometry.dispose()
    }
  }
  layers = [];
  for (let l = 0; l < DEPTH_LAYERS; l++) layers[l] = [];
  if (textures.length === DEPTH_LAYERS * IMAGES_PER_LAYER) fillViewport();
}
window.addEventListener("resize", resize);
resize();
const loader = new THREE.TextureLoader();
loader.crossOrigin = "anonymous";
const TOTAL = DEPTH_LAYERS * IMAGES_PER_LAYER;

function loadAll() {
  shuffledImages = shuffleArray(IMAGE_PATHS);
  currentImageIndex = 0;
  for (let l = 0; l < DEPTH_LAYERS; l++) {
    for (let i = 0; i < IMAGES_PER_LAYER; i++) {
      const path = getNextRandomImage();
      loader.load(path, tex => onLoaded(tex), undefined, () => onLoaded(fallbackTexture(l)))
    }
  }
}

function onLoaded(tex) {
  textures.push(tex);
  loaded++;
  loadingEl.textContent = `Chargement ${Math.round((loaded/TOTAL)*100)}%`;
  if (loaded === TOTAL) initSprites();
}

function initSprites() {
  fillViewport();
  loadingEl.style.display = "none";
  uiEl.style.display = "block";
  lastTime = performance.now();
  animate()
}

function addSprite(layerIndex, startX) {
  const cfg = LAYER_CONFIG[layerIndex];
  const texIndex = Math.floor(Math.random() * textures.length);
  const texture = textures[texIndex] || fallbackTexture(layerIndex);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: !0,
    opacity: cfg.opacity
  });
  const sprite = new THREE.Sprite(mat);
  const image = texture.image;
  let width = MAX_WIDTH;
  let height = MAX_HEIGHT;
  if (image && image.width && image.height) {
    const ratio = image.width / image.height;
    if (ratio > 1) {
      width = MAX_WIDTH;
      height = MAX_WIDTH / ratio
    } else {
      height = MAX_HEIGHT;
      width = MAX_HEIGHT * ratio
    }
  }
  const sizeVar = rand(0.85, 1.15);
  const w = width * cfg.scale * sizeVar;
  const h = height * cfg.scale * sizeVar;
  const spacing = w * rand(0.5, 0.9);
  sprite.scale.set(w, h, 1);
  sprite.position.set(startX + w / 2 + spacing, rand(h / 2, container.clientHeight - h / 2), -layerIndex * 50);
  const speedVariation = rand(0.45, 1.15);
  sprite.userData = {
    speed: cfg.speed * speedVariation,
    width: w,
    height: h,
    seed: rand(0, 1000),
    baseY: sprite.position.y,
    opacity: cfg.opacity
  };
  layers[layerIndex].push(sprite);
  scene.add(sprite);
  return sprite
}

function cleanupSprites() {
  const w = container.clientWidth;
  const bufferZone = w * 0.5;
  for (let l = 0; l < DEPTH_LAYERS; l++) {
    if (!layers[l] || layers[l].length === 0) continue;
    const sprites = layers[l];
    const maxSprites = IMAGES_PER_LAYER + 3;
    if (sprites.length > maxSprites) {
      for (let i = sprites.length - 1; i >= 0; i--) {
        const s = sprites[i];
        const ud = s.userData;
        let shouldRemove = !1;
        if (speedFactor > 0) {
          shouldRemove = (s.position.x - ud.width / 2) > (w + bufferZone)
        } else if (speedFactor < 0) {
          shouldRemove = (s.position.x + ud.width / 2) < (-bufferZone)
        }
        if (shouldRemove) {
          scene.remove(s);
          if (s.material.map) s.material.map.dispose();
          s.material.dispose();
          sprites.splice(i, 1);
          if (sprites.length <= maxSprites) break
        }
      }
    }
  }
}

function fillViewport() {
  const w = container.clientWidth;
  for (let l = 0; l < DEPTH_LAYERS; l++) {
    let sprites = layers[l];
    if (!sprites) continue;
    let rightMost = sprites.length > 0 ? Math.max(...sprites.map(s => s.position.x + s.userData.width / 2)) : -container.clientWidth * 1.2;
    while (rightMost < w) {
      addSprite(l, rightMost);
      sprites = layers[l];
      rightMost = Math.max(...sprites.map(s => s.position.x + s.userData.width / 2))
    }
  }
}

function animate() {
  const now = performance.now();
  const dt = Math.min(40, now - lastTime) / 1000;
  lastTime = now;
  const w = container.clientWidth;
  dragVelocity *= 0.92;
  speedFactor = dragVelocity !== 0 ? Math.sign(dragVelocity) : speedFactor;
  if (Math.random() < 0.01) {
    cleanupSprites()
  }
  for (const sprites of layers) {
    if (!sprites || !sprites.length) continue;
    for (const s of sprites) {
      const ud = s.userData;
      s.position.x += ud.speed * speedFactor * dt;
      if (speedFactor > 0 && s.position.x - ud.width / 2 > w) {
        s.position.x = -ud.width / 2 - rand(0, ud.width)
      } else if (speedFactor < 0 && s.position.x + ud.width / 2 < 0) {
        s.position.x = w + ud.width / 2 + rand(0, ud.width)
      }
      const pulse = 1 + Math.sin(now * 0.001 + ud.seed) * 0.015;
      s.scale.x = ud.width * pulse;
      s.scale.y = ud.height * pulse;
      s.position.y = ud.baseY + Math.sin(now * 0.001 + ud.seed) * 5;
      s.material.opacity = ud.opacity
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate)
}
loadAll();

function getX(e) {
  return e.touches ? e.touches[0].clientX : e.clientX
}
container.addEventListener("mousedown", e => {
  dragActive = !0;
  lastX = getX(e)
});
container.addEventListener("mousemove", e => {
  if (!dragActive) return;
  const x = getX(e);
  const dx = x - lastX;
  lastX = x;
  dragVelocity = dx * 0.02
});
window.addEventListener("mouseup", () => {
  dragActive = !1
});
container.addEventListener("touchstart", e => {
  dragActive = !0;
  lastX = getX(e)
}, {
  passive: !0
});
container.addEventListener("touchmove", e => {
  if (!dragActive) return;
  const x = getX(e);
  const dx = x - lastX;
  lastX = x;
  dragVelocity = dx * 0.02
}, {
  passive: !0
});
window.addEventListener("touchend", () => {
  dragActive = !1
});
container.addEventListener("wheel", e => {
  e.preventDefault();
  const wheelDelta = Math.sign(e.deltaY);
  const direction = wheelDelta > 0 ? 1 : -1;
  const acceleration = 0.8;
  speedFactor = direction * (Math.abs(speedFactor) + acceleration);
  const maxSpeed = 5;
  const sign = Math.sign(speedFactor);
  const absSpeed = Math.min(maxSpeed, Math.abs(speedFactor));
  speedFactor = sign * absSpeed;
  dragVelocity = 0;
  cleanupSprites()
}, {
  passive: !1
});
container.addEventListener("wheel", e => e.preventDefault(), {
  passive: !1
})
