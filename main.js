import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// --- 0. MANAGER LOADING (LOADING SCREEN) ---
const loadingManager = new THREE.LoadingManager();
const progressBar = document.getElementById('progress-bar');
const loadingScreen = document.getElementById('loading-screen');

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    if (progressBar) {
        const percentage = (itemsLoaded / itemsTotal) * 100;
        progressBar.style.width = percentage + '%';
    }
};

loadingManager.onLoad = function () {
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            if (params.PutarOtomatis) controls.autoRotate = true;
        }, 500);
    }
};

// --- 1. SETUP UI POP-UP ---
const popUpDiv = document.createElement('div');
popUpDiv.id = 'info-popup';
popUpDiv.style.cssText = 'position:absolute; top:20px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.85); backdrop-filter:blur(5px); color:white; padding:25px; border-radius:12px; max-width:350px; display:none; font-family:Arial, sans-serif; z-index:100; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid rgba(255,215,0,0.2);';

popUpDiv.innerHTML = `
    <div style="display: flex; align-items: center; border-bottom: 1px solid #555; padding-bottom: 10px; margin-bottom: 15px;">
        <img id="info-icon-img" src="" style="width: 40px; height: 40px; object-fit: contain; margin-right: 15px; display: none; background: rgba(255,255,255,0.1); border-radius: 5px;">
        <h3 id="info-title" style="margin:0; color:#FFD700; font-size:18px;">Judul Info</h3>
    </div>
    <p id="info-desc" style="font-size:14px; line-height:1.6; margin-bottom: 20px; color:#ddd;">Deskripsi.</p>
    <button id="close-btn" style="background:#FFD700; color:#000; border:none; padding:8px 20px; border-radius:20px; cursor:pointer; font-weight:bold; width:100%; transition:background 0.3s;">Tutup</button>
`;
document.body.appendChild(popUpDiv);

document.getElementById('close-btn').addEventListener('click', () => {
    popUpDiv.style.display = 'none';
    if (params.PutarOtomatis) controls.autoRotate = true;
});


// --- 2. SCENE & RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87CEEB, 20, 100); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);


// --- 3. ENVIRONMENT ---
const textureLoader = new THREE.TextureLoader(loadingManager);

// A. Langit
textureLoader.load('./qwantani_dawn_puresky.jpg', function(texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
}, undefined, function() { 
    scene.background = new THREE.Color(0x87CEEB); 
});

// Group Lingkungan
const environment = new THREE.Group();
scene.add(environment);

// B. Tanah Datar Luas
const grassTexture = textureLoader.load('./rumput.jpg');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(100, 100); 

const tanah = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000), 
    new THREE.MeshStandardMaterial({ map: grassTexture, color: 0x4F7942, roughness: 1.0 })
);
tanah.rotation.x = -Math.PI / 2;
tanah.position.y = -0.05;
tanah.receiveShadow = true;
scene.add(tanah);


// --- 4. LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// Lampu Teras (Hangat & Terang)
const frontLight = new THREE.PointLight(0xffaa00, 80, 50); 
frontLight.position.set(0, 4.5, 3.5);
frontLight.castShadow = true;
scene.add(frontLight);

// Lampu Kolong (Biru & Terang)
const bottomLight = new THREE.PointLight(0xaaccff, 30, 30); 
bottomLight.position.set(0, 0.5, 0);
scene.add(bottomLight);


// --- 5. ORNAMEN ALAM (BATU, JALAN, GUNUNG) ---

// Batu Alam
const rockGeo = new THREE.DodecahedronGeometry(1, 0);
const rockMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
for(let i=0; i<15; i++) {
    const r = new THREE.Mesh(rockGeo, rockMat);
    const x=(Math.random()-0.5)*50, z=(Math.random()-0.5)*50;
    if(Math.abs(x)<5 && Math.abs(z)<5) continue; 
    r.position.set(x,0,z); 
    r.scale.setScalar(0.3+Math.random()*0.5); 
    r.scale.y*=0.6; 
    r.castShadow=true; r.receiveShadow=true; 
    scene.add(r);
}

// Pegunungan
const mGeo = new THREE.ConeGeometry(30, 40, 4);
const mMat = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
for(let i=0; i<8; i++) {
    const m = new THREE.Mesh(mGeo, mMat);
    const a = (i/8)*Math.PI, rad=80;
    m.position.set(Math.cos(a)*rad*1.5, -5, -50-Math.sin(a)*rad*0.5);
    m.scale.setScalar(1+Math.random()*1.5); 
    scene.add(m);
}


// --- 6. POHON-POHON TRADISIONAL ---
// (Pohon dihapus sesuai permintaan)


// --- 7. INFO-SPOTS ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const hotspots = [];

function createHotspot(x, y, z, title, description, iconURL = null) {
    // Buat sprite untuk icon
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Gambar lingkaran biru sebagai background
    ctx.fillStyle = '#4A90E2';
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
    
    // Border putih
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 64, 57, 0, Math.PI * 2);
    ctx.stroke();
    
    // Gambar huruf "N" merah di tengah (kompas style)
    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 64, 64);
    
    // Jika ada iconURL, coba load gambar
    if (iconURL) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            ctx.clearRect(0, 0, 128, 128);
            ctx.drawImage(img, 0, 0, 128, 128);
            texture.needsUpdate = true;
        };
        img.src = iconURL;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.6, 0.6, 1);
    sprite.position.set(x, y, z);
    sprite.userData = { title: title, description: description, initialY: y, iconURL: iconURL };
    
    scene.add(sprite);
    hotspots.push(sprite);
}

// Icon 1: Kompas (Arah Utara) - Ganti dengan path gambar kompas Anda
createHotspot(0, 4.8, 1.5, "Selalu Menghadap Utara", "Fakta Unik: Setiap Tongkonan WAJIB menghadap ke Utara (arah leluhur).", './kompas.png'); 

// Icon 2: Tanduk Kerbau (Status Sosial) - Ganti dengan path gambar tanduk kerbau Anda
createHotspot(0, 3.1, 3.8, "Status Sosial & Kabongo'", "Fakta Unik: Kepala kerbau menandakan status sosial pemilik.", './tanduk kerbau.png'); 

// Icon 3: Rumah Tongkonan (Anti-Gempa) - Ganti dengan path gambar rumah tongkonan Anda
createHotspot(2.5, 2.5, 0, "Teknologi Anti-Gempa", "Fakta Unik: Tanpa paku! Sistem pasak kayu tahan guncangan gempa.", './tongkonan.png');

// Icon 4: Batu/Pondasi (Sulluk) - Ganti dengan path gambar batu Anda
createHotspot(1.5, 1.0, 2, "Pondasi Batu (Sulluk)", "Fakta Unik: Tiang tidak ditanam, ditaruh di batu agar anti rayap.", './tiang batu.png');

// Icon 5: Ukiran Tradisional (4 Warna) - Ganti dengan path gambar ukiran Anda
createHotspot(-2.5, 2.0, 0, "Rahasia 4 Warna", "Fakta Unik: Hanya pakai 4 warna alam: Hitam, Merah, Kuning, Putih.", './ukiran.png'); 

window.addEventListener('pointerdown', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(hotspots);
    
    if (intersects.length > 0) {
        const data = intersects[0].object.userData;
        document.getElementById('info-title').innerText = data.title;
        document.getElementById('info-desc').innerText = data.description;
        const imgSlot = document.getElementById('info-icon-img');
        if (data.iconURL) { imgSlot.src = data.iconURL; imgSlot.style.display = 'block'; } else { imgSlot.style.display = 'none'; }
        popUpDiv.style.display = 'block';
        controls.autoRotate = false;
    }
});


// --- 8. LOGIKA WAKTU & GUI ---
const params = { Jam: 12, PutarOtomatis: true };

function updateMatahari() {
    const jam = params.Jam;
    const sudut = (jam / 24) * (Math.PI * 2) - (Math.PI / 2);
    sunLight.position.set(Math.cos(sudut)*40, Math.sin(sudut)*40, Math.sin(sudut*0.5)*20);

    if (jam >= 6 && jam <= 18) {
        sunLight.intensity = 1.5; 
        ambientLight.intensity = 0.5; 
        renderer.toneMappingExposure = (jam < 7 || jam > 17) ? 0.5 : 1.2;
        sunLight.color.setHSL((jam < 8 || jam > 16) ? 0.05 : 0.1, (jam < 8 || jam > 16) ? 1.0 : 0.5, 0.9);
        frontLight.intensity = 0; 
        bottomLight.intensity = 0;
        scene.fog.color.set(0x87CEEB);
    } else {
        sunLight.intensity = 0.4;
        ambientLight.intensity = 0.3;
        sunLight.color.setHSL(0.6, 0.8, 0.8);
        renderer.toneMappingExposure = 0.6;
        frontLight.intensity = 80;
        bottomLight.intensity = 30;
        scene.fog.color.set(0x111526);
    }
}
updateMatahari();

const gui = new GUI();
const folder = gui.addFolder('Pengaturan Suasana');
folder.add(params, 'Jam', 0, 24).onChange(updateMatahari).listen();
folder.add(params, 'PutarOtomatis');


// --- 9. LOAD MODEL ---
const loader = new GLTFLoader(loadingManager);

// Load Rumah Adat Tongkonan
loader.load('./tantor.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.traverse((n) => {
        if (n.isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
        }
    });
    scene.add(model);
}, undefined, (error) => {
    console.error("Gagal memuat model rumah:", error);
});

// Load Kerbau (di depan rumah tongkonan)
loader.load('./kerbau4.glb', (gltf) => {
    const kerbau1 = gltf.scene;
    kerbau1.scale.set(1.5, 1.5, 1.5); // Ukuran kerbau
    kerbau1.position.set(3, 0, 6); // Posisi di depan rumah (kanan)
    kerbau1.rotation.y = Math.PI * 0.3; // Rotasi menghadap rumah
    kerbau1.traverse((n) => {
        if (n.isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
        }
    });
    scene.add(kerbau1);

    // Kerbau kedua (kiri depan)
    const kerbau2 = kerbau1.clone();
    kerbau2.position.set(-3.5, 0, 7);
    kerbau2.rotation.y = -Math.PI * 0.4;
    scene.add(kerbau2);
}, undefined, (error) => {
    console.error("Gagal memuat model kerbau:", error);
});

// Load Pohon Palm (di belakang dan sekitar rumah)
loader.load('./pohon palm.glb', (gltf) => {
    // Pohon 1 - Belakang kiri
    const pohon1 = gltf.scene;
    pohon1.scale.set(0.8, 0.8, 0.8);
    pohon1.position.set(-8, 0, -6);
    pohon1.traverse((n) => {
        if (n.isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
        }
    });
    scene.add(pohon1);

    // Pohon 2 - Belakang kanan
    const pohon2 = pohon1.clone();
    pohon2.position.set(7, 0, -7);
    pohon2.scale.set(0.9, 0.9, 0.9);
    scene.add(pohon2);

    // Pohon 3 - Samping kiri
    const pohon3 = pohon1.clone();
    pohon3.position.set(-10, 0, 2);
    pohon3.scale.set(0.7, 0.7, 0.7);
    scene.add(pohon3);

    // Pohon 4 - Samping kanan
    const pohon4 = pohon1.clone();
    pohon4.position.set(9, 0, 1);
    pohon4.scale.set(0.75, 0.75, 0.75);
    scene.add(pohon4);

    // Pohon 5 - Belakang tengah
    const pohon5 = pohon1.clone();
    pohon5.position.set(0, 0, -9);
    pohon5.scale.set(1.0, 1.0, 1.0);
    scene.add(pohon5);
}, undefined, (error) => {
    console.error("Gagal memuat model pohon:", error);
});


// --- 10. ANIMASI & KONTROL ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 5, 20);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.5;
controls.maxPolarAngle = Math.PI / 2 - 0.1;

// === AUDIO BACKGROUND ===
const audioListener = new THREE.AudioListener();
camera.add(audioListener);

const backgroundMusic = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader(loadingManager);

audioLoader.load('./madeden_marampa.mp3', function(buffer) {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.5);
});

function resumeAudioContext() {
    if (audioListener.context.state === 'suspended') {
        audioListener.context.resume();
    }
    if (backgroundMusic.buffer && !backgroundMusic.isPlaying) {
        backgroundMusic.play();
    }
}

window.addEventListener('click', resumeAudioContext);
window.addEventListener('keydown', resumeAudioContext);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    if (params.PutarOtomatis) {
        params.Jam += 0.03;
        if (params.Jam > 24) params.Jam = 0;
        updateMatahari();
    }

    hotspots.forEach(h => {
        h.position.y = h.userData.initialY + Math.sin(time * 2.5) * 0.08;
    });

    controls.update();
    renderer.render(scene, camera);
}

animate();
