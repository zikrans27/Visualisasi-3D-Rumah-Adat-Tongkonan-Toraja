import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import TWEEN from 'three/addons/libs/tween.module.js';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';
// import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js'; // Nonaktifkan Lensflare

// --- NONAKTIFKAN POST-PROCESSING SEMENTARA (UNTUK MENGATASI BLACK SCREEN) ---
// import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
// import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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
            startIntroAnimation(); // Mulai animasi intro saat loading selesai
        }, 500);
    }
};

loadingManager.onError = function (url) {
    console.error('Gagal memuat aset: ' + url);
};

// Fallback: Jika loading macet lebih dari 10 detik, paksa masuk
setTimeout(() => {
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        console.warn("Loading terlalu lama (mungkin ada aset hilang). Memaksa masuk...");
        // Panggil onLoad secara manual agar user tetap bisa melihat scene
        loadingManager.onLoad();
    }
}, 10000);

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

// --- 1.1 SETUP TOMBOL INFO DEVELOPER ---
const devBtn = document.createElement('button');
devBtn.innerText = 'Info Developer';
devBtn.style.cssText = 'position:absolute; bottom:20px; right:20px; background:rgba(0,0,0,0.6); color:#FFD700; border:1px solid #FFD700; padding:10px 20px; border-radius:20px; cursor:pointer; font-family:Arial, sans-serif; z-index:100; transition: all 0.3s; font-weight:bold;';
devBtn.innerText = 'ℹ️';
devBtn.title = "Info Developer";
devBtn.style.cssText = 'position:absolute; top:120px; left:20px; background:rgba(0,0,0,0.6); color:#FFD700; border:1px solid #FFD700; width:40px; height:40px; border-radius:50%; cursor:pointer; font-family:Arial, sans-serif; z-index:100; transition: all 0.3s; font-weight:bold; font-size:20px; display:flex; justify-content:center; align-items:center;';
devBtn.onmouseover = () => devBtn.style.background = 'rgba(255, 215, 0, 0.2)';
devBtn.onmouseout = () => devBtn.style.background = 'rgba(0,0,0,0.6)';
document.body.appendChild(devBtn);

const devModal = document.createElement('div');
devModal.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.9); color:white; padding:30px; border-radius:15px; border:1px solid #FFD700; display:none; z-index:1000; text-align:center; min-width:300px; font-family:Arial, sans-serif; box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);';
devModal.innerHTML = `
    <h2 style="color:#FFD700; margin-top:0; border-bottom:1px solid #555; padding-bottom:10px;">Tim Pengembang</h2>
    <div style="text-align:left; margin:20px 0; line-height:1.8; font-size:14px;">
        <p style="margin:5px 0;"><strong>Ide:</strong><br>Muhammad Khairan Muslim Pasarai (47224046)</p>
        <p style="margin:5px 0;"><strong>Pencarian Asset:</strong><br>Zikran Syakur (47224041)</p>
        <p style="margin:5px 0;"><strong>Coding:</strong><br>Nela Adelia Suci (47224043)</p>
    </div>
    <button id="close-dev-btn" style="background:#FFD700; color:black; border:none; padding:8px 25px; border-radius:20px; cursor:pointer; font-weight:bold; transition:transform 0.2s;">Tutup</button>
`;
document.body.appendChild(devModal);

devBtn.addEventListener('click', () => {
    devModal.style.display = 'block';
});

devModal.querySelector('#close-dev-btn').addEventListener('click', () => {
    devModal.style.display = 'none';
});
devModal.querySelector('#close-dev-btn').onmouseover = function() { this.style.transform = 'scale(1.05)'; };
devModal.querySelector('#close-dev-btn').onmouseout = function() { this.style.transform = 'scale(1)'; };

// --- 1.1.1 SETUP TOMBOL SHARE ---
const shareBtn = document.createElement('button');
shareBtn.innerText = '🔗';
shareBtn.title = "Bagikan";
shareBtn.style.cssText = 'position:absolute; top:170px; left:20px; background:rgba(0,0,0,0.6); color:#FFD700; border:1px solid #FFD700; width:40px; height:40px; border-radius:50%; cursor:pointer; font-family:Arial, sans-serif; z-index:100; transition: all 0.3s; font-weight:bold; font-size:20px; display:flex; justify-content:center; align-items:center;';
shareBtn.onmouseover = () => shareBtn.style.background = 'rgba(255, 215, 0, 0.2)';
shareBtn.onmouseout = () => shareBtn.style.background = 'rgba(0,0,0,0.6)';
document.body.appendChild(shareBtn);

const shareModal = document.createElement('div');
shareModal.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.9); color:white; padding:25px; border-radius:15px; border:1px solid #FFD700; display:none; z-index:1000; text-align:center; min-width:280px; font-family:Arial, sans-serif; box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);';
shareModal.innerHTML = `
    <h3 style="color:#FFD700; margin-top:0; border-bottom:1px solid #555; padding-bottom:10px;">Bagikan ke Teman</h3>
    <div style="display:flex; justify-content:center; gap:15px; margin:20px 0;">
        <button id="share-wa" style="background:#25D366; border:none; width:50px; height:50px; border-radius:50%; cursor:pointer; font-size:24px;" title="WhatsApp">📱</button>
        <button id="share-fb" style="background:#1877F2; border:none; width:50px; height:50px; border-radius:50%; cursor:pointer; font-size:24px;" title="Facebook">📘</button>
        <button id="share-tw" style="background:#1DA1F2; border:none; width:50px; height:50px; border-radius:50%; cursor:pointer; font-size:24px;" title="Twitter / X">🐦</button>
        <button id="share-cp" style="background:#555; border:none; width:50px; height:50px; border-radius:50%; cursor:pointer; font-size:24px;" title="Salin Link">📋</button>
    </div>
    <button id="close-share-btn" style="background:transparent; color:#FFD700; border:1px solid #FFD700; padding:5px 20px; border-radius:20px; cursor:pointer; font-size:14px;">Tutup</button>
`;
document.body.appendChild(shareModal);

shareBtn.addEventListener('click', () => {
    shareModal.style.display = 'block';
});

shareModal.querySelector('#close-share-btn').addEventListener('click', () => {
    shareModal.style.display = 'none';
});

const currentUrl = encodeURIComponent(window.location.href);
const shareText = encodeURIComponent("Cek visualisasi 3D Rumah Adat Toraja ini! Keren banget!");

shareModal.querySelector('#share-wa').onclick = () => window.open(`https://wa.me/?text=${shareText}%20${currentUrl}`, '_blank');
shareModal.querySelector('#share-fb').onclick = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`, '_blank');
shareModal.querySelector('#share-tw').onclick = () => window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${currentUrl}`, '_blank');
shareModal.querySelector('#share-cp').onclick = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link berhasil disalin!");
};

// --- 1.2 TOMBOL RESET KAMERA ---
const resetBtn = document.createElement('button');
resetBtn.innerText = 'Reset Kamera';
resetBtn.style.cssText = 'position:absolute; bottom:70px; right:20px; background:rgba(0,0,0,0.6); color:#FFD700; border:1px solid #FFD700; padding:10px 20px; border-radius:20px; cursor:pointer; font-family:Arial, sans-serif; z-index:100; transition: all 0.3s; font-weight:bold;';
resetBtn.innerText = '🔄';
resetBtn.title = "Reset Kamera";
resetBtn.style.cssText = 'position:absolute; top:70px; left:20px; background:rgba(0,0,0,0.6); color:#FFD700; border:1px solid #FFD700; width:40px; height:40px; border-radius:50%; cursor:pointer; font-family:Arial, sans-serif; z-index:100; transition: all 0.3s; font-weight:bold; font-size:20px; display:flex; justify-content:center; align-items:center;';
resetBtn.onmouseover = () => resetBtn.style.background = 'rgba(255, 215, 0, 0.2)';
resetBtn.onmouseout = () => resetBtn.style.background = 'rgba(0,0,0,0.6)';
document.body.appendChild(resetBtn);

resetBtn.addEventListener('click', () => {
    if (typeof controls !== 'undefined' && typeof camera !== 'undefined') {
        controls.enabled = true;
        if (typeof isIntroPlaying !== 'undefined') isIntroPlaying = false;
        
        new TWEEN.Tween(camera.position).to({ x: 0, y: 5, z: 20 }, 1500).easing(TWEEN.Easing.Cubic.Out).start();
        new TWEEN.Tween(controls.target).to({ x: 0, y: 2, z: 0 }, 1500).easing(TWEEN.Easing.Cubic.Out).start();
    }
});

// --- 1.3 TOMBOL TOUR GUIDE (PEMANDU SUARA) ---
const tourBtn = document.createElement('button');
tourBtn.innerText = 'Mulai Tur Suara';
tourBtn.style.cssText = 'position:absolute; bottom:20px; right:20px; background:rgba(0,0,0,0.6); color:#FFD700; border:1px solid #FFD700; padding:10px 20px; border-radius:20px; cursor:pointer; font-family:Arial, sans-serif; z-index:100; transition: all 0.3s; font-weight:bold;';
tourBtn.onmouseover = () => tourBtn.style.background = 'rgba(255, 215, 0, 0.2)';
tourBtn.onmouseout = () => tourBtn.style.background = 'rgba(0,0,0,0.6)';
document.body.appendChild(tourBtn);

let isTourActive = false;

// --- ANIMASI TEKS TOMBOL ---
const tourTexts = ['Mulai Tur Suara', 'Klik untuk Tur', 'Pandu Saya'];
let tourTextIndex = 0;
setInterval(() => {
    if (!isTourActive) {
        tourTextIndex = (tourTextIndex + 1) % tourTexts.length;
        tourBtn.style.opacity = '0.3'; // Redup saat ganti teks (efek fade)
        setTimeout(() => {
            if (!isTourActive) tourBtn.innerText = tourTexts[tourTextIndex];
            tourBtn.style.opacity = '1';
        }, 300); // Sesuaikan dengan durasi transition CSS (0.3s)
    }
}, 3000); // Ganti teks setiap 3 detik

function startTour() {
    if (typeof hotspots === 'undefined' || hotspots.length === 0) return;
    isTourActive = true;
    tourBtn.style.opacity = '1'; // Pastikan tombol terlihat penuh
    tourBtn.innerText = 'Stop Tur';
    tourBtn.style.background = 'rgba(200, 50, 50, 0.8)';
    
    // Matikan kontrol user & intro
    if (typeof controls !== 'undefined') controls.enabled = false;
    if (typeof isIntroPlaying !== 'undefined') isIntroPlaying = false;

    playTourStep(0);
}

function stopTour() {
    isTourActive = false;
    tourBtn.innerText = 'Mulai Tur Suara';
    tourBtn.style.background = 'rgba(0,0,0,0.6)';
    
    window.speechSynthesis.cancel(); // Stop suara bicara
    popUpDiv.style.display = 'none';
    if (typeof controls !== 'undefined') controls.enabled = true;

    // Reset kamera ke posisi awal
    if (typeof camera !== 'undefined' && typeof controls !== 'undefined') {
        new TWEEN.Tween(camera.position).to({ x: 0, y: 5, z: 20 }, 1500).easing(TWEEN.Easing.Cubic.Out).start();
        new TWEEN.Tween(controls.target).to({ x: 0, y: 2, z: 0 }, 1500).easing(TWEEN.Easing.Cubic.Out).start();
    }
}

tourBtn.addEventListener('click', () => {
    if (isTourActive) stopTour();
    else startTour();
});

// --- 1.4 TOMBOL VOLUME (MUSIK & TUR) ---
const volBtn = document.createElement('button');
volBtn.innerText = '🔉'; // Default Normal
volBtn.title = "Pengaturan Volume";
volBtn.style.cssText = 'position:absolute; top:20px; left:20px; background:rgba(0,0,0,0.6); color:#FFD700; border:1px solid #FFD700; width:40px; height:40px; border-radius:50%; cursor:pointer; font-family:Arial, sans-serif; z-index:100; transition: all 0.3s; font-weight:bold; font-size:20px; display:flex; justify-content:center; align-items:center;';
volBtn.onmouseover = () => volBtn.style.background = 'rgba(255, 215, 0, 0.2)';
volBtn.onmouseout = () => volBtn.style.background = 'rgba(0,0,0,0.6)';
document.body.appendChild(volBtn);

let volumeState = 1; // 0: Mute, 1: Normal, 2: High
let tourVolume = 1.0;

volBtn.addEventListener('click', () => {
    volumeState = (volumeState + 1) % 3;
    updateVolume();
});

function updateVolume() {
    let musicVol = 0;
    
    switch(volumeState) {
        case 0: // Mute
            volBtn.innerText = '🔇';
            musicVol = 0;
            tourVolume = 0;
            break;
        case 1: // Normal
            volBtn.innerText = '🔉';
            musicVol = 0.5;
            tourVolume = 1.0;
            break;
        case 2: // High (Besarkan Suara)
            volBtn.innerText = '🔊';
            musicVol = 1.0;
            tourVolume = 1.0;
            break;
    }

    // Update Audio Objects (cek jika sudah didefinisikan)
    if(typeof backgroundMusic !== 'undefined' && backgroundMusic.buffer) backgroundMusic.setVolume(musicVol);
    if(typeof rainSound !== 'undefined' && rainSound.buffer) rainSound.setVolume(musicVol);
    if(typeof thunderSound !== 'undefined' && thunderSound.buffer) thunderSound.setVolume(Math.min(1, musicVol * 2));
    if(typeof clickSound !== 'undefined' && clickSound.buffer) clickSound.setVolume(Math.min(1, musicVol * 1.6));
}

function playTourStep(index) {
    if (!isTourActive) return;
    
    if (index >= hotspots.length) {
        stopTour(); // Selesai semua hotspot
        return;
    }

    const h = hotspots[index];
    const data = h.userData;

    // Hitung posisi kamera (8 meter di depan hotspot dari arah pusat)
    const targetPos = h.position.clone();
    const offsetDir = targetPos.clone().sub(new THREE.Vector3(0, 0, 0)).normalize();
    if (offsetDir.lengthSq() < 0.01) offsetDir.set(0, 0, 1); // Fallback
    const camPos = targetPos.clone().add(offsetDir.multiplyScalar(8)); 
    camPos.y = Math.max(camPos.y, 3); // Minimal tinggi 3m agar tidak tertutup tanah

    // Animasi Kamera ke Hotspot
    new TWEEN.Tween(camera.position).to(camPos, 2000).easing(TWEEN.Easing.Cubic.InOut).start();
    new TWEEN.Tween(controls.target).to(targetPos, 2000).easing(TWEEN.Easing.Cubic.InOut)
        .onComplete(() => {
            if (!isTourActive) return;

            // Tampilkan Info Popup (Simulasi Klik)
            document.getElementById('info-title').innerText = data.title;
            document.getElementById('info-desc').innerText = data.description;
            const imgSlot = document.getElementById('info-icon-img');
            if (data.iconURL) { imgSlot.src = data.iconURL; imgSlot.style.display = 'block'; } else { imgSlot.style.display = 'none'; }
            popUpDiv.style.display = 'block';

            // Mulai Bicara (Text-to-Speech)
            const utterance = new SpeechSynthesisUtterance(`${data.title}. ${data.description}`);
            utterance.lang = 'id-ID'; // Bahasa Indonesia
            
            // Cari suara Bahasa Indonesia yang tersedia di browser agar logatnya pas
            const voices = window.speechSynthesis.getVoices();
            const indoVoice = voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID' || v.name.toLowerCase().includes('indonesia'));
            if (indoVoice) utterance.voice = indoVoice;

            utterance.rate = 0.9; // Kecepatan bicara sedikit lambat agar jelas
            utterance.volume = tourVolume; // Set volume tur sesuai pengaturan
            
            utterance.onend = () => {
                if (isTourActive) {
                    setTimeout(() => {
                        popUpDiv.style.display = 'none';
                        playTourStep(index + 1); // Lanjut ke hotspot berikutnya
                    }, 1500); // Jeda 1.5 detik sebelum lanjut
                }
            };

            window.speechSynthesis.cancel(); // Stop suara sebelumnya jika ada
            window.speechSynthesis.speak(utterance);
        })
        .start();
}

// --- 2. SCENE & RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x87CEEB, 0.01); // Gunakan FogExp2 (Lebih ringan & natural)

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); // preserveDrawingBuffer wajib true untuk html2canvas
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // OPTIMISASI: Batasi pixel ratio max 2 agar GPU tidak jebol (Black Screen)
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// --- 2.1 POST PROCESSING (DINONAKTIFKAN) ---
// const renderScene = new RenderPass(scene, camera);

// // OPTIMISASI: Gunakan resolusi setengah untuk Bloom agar performa lebih ringan namun tetap cantik
// const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 1.5, 0.4, 0.85);
// bloomPass.threshold = 0.2; // Ambang batas cahaya
// bloomPass.strength = 0.5;  // Kekuatan pendaran
// bloomPass.radius = 0.5;    // Radius sebaran

// const outputPass = new OutputPass();

// const composer = new EffectComposer(renderer);
// composer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Penting untuk Post-Processing
// composer.addPass(renderScene);
// composer.addPass(bloomPass);
// composer.addPass(outputPass);

// --- 3. ENVIRONMENT ---
const textureLoader = new THREE.TextureLoader(loadingManager);

// Set warna background default (agar tidak hitam saat loading tekstur)
scene.background = new THREE.Color(0x87CEEB);

// A. Langit
textureLoader.load('./qwantani_dawn_puresky.jpg', function(texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    // scene.background = texture; // Matikan background gambar agar warna langit bisa berubah dinamis
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

// --- 3.1 BAYANGAN AWAN BERGERAK (PROCEDURAL) ---
const canvasCloud = document.createElement('canvas');
canvasCloud.width = 512; canvasCloud.height = 512;
const ctxCloud = canvasCloud.getContext('2d');

// Buat pola noise awan hitam transparan
ctxCloud.clearRect(0, 0, 512, 512);
for (let i = 0; i < 150; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 40 + Math.random() * 60;
    const grd = ctxCloud.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(0,0,0,0.2)'); // Hitam pudar di tengah
    grd.addColorStop(1, 'rgba(0,0,0,0)');   // Transparan di pinggir
    ctxCloud.fillStyle = grd;
    ctxCloud.beginPath();
    ctxCloud.arc(x, y, r, 0, Math.PI * 2);
    ctxCloud.fill();
}

const cloudTexture = new THREE.CanvasTexture(canvasCloud);
cloudTexture.wrapS = THREE.RepeatWrapping;
cloudTexture.wrapT = THREE.RepeatWrapping;
cloudTexture.repeat.set(15, 15); // Ulangi tekstur agar mencakup area luas

const cloudShadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshBasicMaterial({ map: cloudTexture, transparent: true, opacity: 0.8, depthWrite: false })
);
cloudShadowMesh.rotation.x = -Math.PI / 2;
cloudShadowMesh.position.y = -0.04; // Sedikit di atas tanah (-0.05) agar tidak tertutup tanah
scene.add(cloudShadowMesh);

// --- 4. LIGHTING ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.bias = -0.0001;
sunLight.shadow.normalBias = 0.05;
const d = 30;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
scene.add(sunLight);

// Setup Lens Flare (Efek Silau Matahari)
const flareLoader = new THREE.TextureLoader(loadingManager);
const textureFlare0 = flareLoader.load('https://unpkg.com/three@0.160.0/examples/textures/lensflare/lensflare0.png');
const textureFlare3 = flareLoader.load('https://unpkg.com/three@0.160.0/examples/textures/lensflare/lensflare3.png');
// const flareLoader = new THREE.TextureLoader(loadingManager);
// const textureFlare0 = flareLoader.load('https://unpkg.com/three@0.160.0/examples/textures/lensflare/lensflare0.png');
// const textureFlare3 = flareLoader.load('https://unpkg.com/three@0.160.0/examples/textures/lensflare/lensflare3.png');

const lensflare = new Lensflare();
lensflare.addElement(new LensflareElement(textureFlare0, 700, 0, sunLight.color));
lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9));
lensflare.addElement(new LensflareElement(textureFlare3, 70, 1));
sunLight.add(lensflare);
// const lensflare = new Lensflare();
// lensflare.addElement(new LensflareElement(textureFlare0, 700, 0, sunLight.color));
// lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
// lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
// lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9));
// lensflare.addElement(new LensflareElement(textureFlare3, 70, 1));
// sunLight.add(lensflare);

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
const mGeo = new THREE.SphereGeometry(60, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.45); // Gunakan setengah bola agar melengkung halus
for(let i=0; i<8; i++) {
    // Buat warna dasar dan beri variasi acak (terang/gelap)
    const color = new THREE.Color(0x2F4F4F);
    color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.15); // Variasi lightness +/- 7.5%
    const mMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 });

    const m = new THREE.Mesh(mGeo, mMat);
    const a = (i/8)*Math.PI, rad=160; // Jarak diperjauh sedikit
    m.position.set(Math.cos(a)*rad*1.5, -20, -100-Math.sin(a)*rad*0.6); // Posisi diturunkan agar menyatu dengan tanah
    m.scale.set(1.5+Math.random(), 0.4+Math.random()*0.5, 1.5+Math.random()); // Skala dipipihkan (lebar tapi tidak terlalu tinggi)
    scene.add(m);
}


// --- 6. POHON-POHON TRADISIONAL ---
// (Pohon dihapus sesuai permintaan)


// --- 7. INFO-SPOTS ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const hotspots = [];

function createHotspot(x, y, z, title, description, iconURL = null, label = 'N') {
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
    ctx.fillText(label, 64, 64);
    
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
        // Mainkan suara klik
        if (clickSound.buffer) {
            if (clickSound.isPlaying) clickSound.stop();
            clickSound.play();
        }

        const data = intersects[0].object.userData;
        document.getElementById('info-title').innerText = data.title;
        document.getElementById('info-desc').innerText = data.description;
        const imgSlot = document.getElementById('info-icon-img');
        if (data.iconURL) { imgSlot.src = data.iconURL; imgSlot.style.display = 'block'; } else { imgSlot.style.display = 'none'; }
        popUpDiv.style.display = 'block';
        controls.autoRotate = false;
    }
});

// Logika Hover Hotspot (Ganti Warna saat Mouse di Atas)
let hoveredHotspot = null;
window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(hotspots);

    if (intersects.length > 0) {
        if (hoveredHotspot !== intersects[0].object) {
            if (hoveredHotspot) hoveredHotspot.material.color.set(0xffffff); // Reset yang lama
            hoveredHotspot = intersects[0].object;
            hoveredHotspot.material.color.set(0xffd700); // Ubah warna jadi Emas saat hover
            document.body.style.cursor = 'pointer';
        }
    } else {
        if (hoveredHotspot) {
            hoveredHotspot.material.color.set(0xffffff); // Reset warna putih
            hoveredHotspot = null;
            document.body.style.cursor = 'default';
        }
    }
});


// --- 8. LOGIKA WAKTU & GUI ---
const params = { Jam: 12, PutarOtomatis: true, Hujan: false, ModeNyata: false };

// Setup Sistem Hujan
const rainGeo = new THREE.BufferGeometry();
const rainCount = 25000; // Jumlah partikel diperbanyak agar lebih deras
const rainPos = new Float32Array(rainCount * 3);
for(let i=0; i<rainCount*3; i+=3){
    rainPos[i] = (Math.random() - 0.5) * 100;     // Sebaran X
    rainPos[i+1] = Math.random() * 60;            // Sebaran Y (Tinggi)
    rainPos[i+2] = (Math.random() - 0.5) * 100;   // Sebaran Z
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));

// Buat tekstur bulat untuk partikel (Hujan & Splash)
const canvasRain = document.createElement('canvas');
canvasRain.width = 32; canvasRain.height = 32;
const ctxRain = canvasRain.getContext('2d');
ctxRain.fillStyle = 'white';
ctxRain.beginPath();
ctxRain.arc(16, 16, 15, 0, Math.PI * 2);
ctxRain.fill();
const rainTexture = new THREE.CanvasTexture(canvasRain);

const rainMat = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.15, map: rainTexture, transparent: true, opacity: 0.8, depthWrite: false });
const rainSystem = new THREE.Points(rainGeo, rainMat);
rainSystem.visible = false;
scene.add(rainSystem);

// Setup Splash (Cipratan Air)
const splashGeo = new THREE.BufferGeometry();
const splashCount = 6000; // Kapasitas cipratan ditambah
const splashPos = new Float32Array(splashCount * 3);
const splashLife = new Float32Array(splashCount); // Umur cipratan

for(let i=0; i<splashCount*3; i+=3){
    splashPos[i+1] = -100; // Sembunyikan di bawah tanah saat awal
}
splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPos, 3));
const splashMat = new THREE.PointsMaterial({ color: 0xdddddd, size: 0.4, map: rainTexture, transparent: true, opacity: 0.6, depthWrite: false });
const splashSystem = new THREE.Points(splashGeo, splashMat);
splashSystem.visible = false;
scene.add(splashSystem);
let splashIndex = 0;

// Setup Kunang-Kunang (Fireflies)
const fireflyGeo = new THREE.BufferGeometry();
const fireflyCount = 50;
const fireflyPos = new Float32Array(fireflyCount * 3);
const fireflyColors = new Float32Array(fireflyCount * 3);
const fireflyPhase = []; // Menyimpan fase kedip unik untuk setiap kunang-kunang

for(let i=0; i<fireflyCount; i++){
    const i3 = i * 3;
    fireflyPos[i3] = (Math.random() - 0.5) * 60;     // Area X
    fireflyPos[i3+1] = 0.5 + Math.random() * 3;      // Tinggi Y
    fireflyPos[i3+2] = (Math.random() - 0.5) * 60;   // Area Z
    
    // Warna awal (Kuning-Hijau: R=0.8, G=1.0, B=0.0)
    fireflyColors[i3] = 0.8; fireflyColors[i3+1] = 1.0; fireflyColors[i3+2] = 0.0;
    fireflyPhase.push(Math.random() * Math.PI * 2); // Fase acak agar tidak berkedip bareng
}
fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
fireflyGeo.setAttribute('color', new THREE.BufferAttribute(fireflyColors, 3));

// Buat tekstur glow bulat untuk kunang-kunang
const canvasFirefly = document.createElement('canvas');
canvasFirefly.width = 32; canvasFirefly.height = 32;
const ctxFirefly = canvasFirefly.getContext('2d');
const gradFirefly = ctxFirefly.createRadialGradient(16, 16, 2, 16, 16, 16);
gradFirefly.addColorStop(0, 'white');
gradFirefly.addColorStop(1, 'rgba(255,255,255,0)');
ctxFirefly.fillStyle = gradFirefly;
ctxFirefly.fillRect(0, 0, 32, 32);
const fireflyTexture = new THREE.CanvasTexture(canvasFirefly);

const fireflyMat = new THREE.PointsMaterial({ vertexColors: true, size: 0.8, map: fireflyTexture, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false });
const fireflySystem = new THREE.Points(fireflyGeo, fireflyMat);
scene.add(fireflySystem);

function updateMatahari() {
    const jam = params.Jam;
    const sudut = (jam / 24) * (Math.PI * 2) - (Math.PI / 2);
    sunLight.position.set(Math.cos(sudut)*40, Math.sin(sudut)*40, Math.sin(sudut*0.5)*20);

    // Definisi Warna Langit (Palette)
    const colorMalam = new THREE.Color(0x111526); // Biru Gelap
    const colorPagi = new THREE.Color(0xFF9966);  // Oranye Fajar
    const colorSiang = new THREE.Color(0x87CEEB); // Biru Langit
    const colorSore = new THREE.Color(0xFF8C00);  // Oranye Senja

    let skyColor = new THREE.Color();
    let sunInt = 0, ambInt = 0, lampInt = 0, fogDens = 0.01;

    // Logika Transisi Halus (Interpolasi)
    if (jam >= 5 && jam < 7) { 
        // Fajar (05.00 - 07.00)
        const t = (jam - 5) / 2;
        skyColor.lerpColors(colorMalam, colorPagi, t);
        sunInt = THREE.MathUtils.lerp(0.1, 1.0, t);
        ambInt = THREE.MathUtils.lerp(0.2, 0.5, t);
        lampInt = THREE.MathUtils.lerp(80, 0, t); // Lampu mati perlahan
        fogDens = THREE.MathUtils.lerp(0.015, 0.008, t);
    } 
    else if (jam >= 7 && jam < 16) { 
        // Siang (07.00 - 16.00)
        const t = (jam - 7) / 9;
        skyColor.lerpColors(colorPagi, colorSiang, Math.min(t * 3, 1)); // Cepat berubah ke biru
        sunInt = 1.5;
        ambInt = 0.6;
        lampInt = 0;
        fogDens = 0.008;
    }
    else if (jam >= 16 && jam < 18.5) { 
        // Senja (16.00 - 18.30)
        const t = (jam - 16) / 2.5;
        skyColor.lerpColors(colorSiang, colorSore, t);
        sunInt = THREE.MathUtils.lerp(1.5, 0.5, t);
        ambInt = THREE.MathUtils.lerp(0.6, 0.3, t);
        lampInt = THREE.MathUtils.lerp(0, 80, t > 0.5 ? (t-0.5)*2 : 0); // Lampu mulai nyala
        fogDens = THREE.MathUtils.lerp(0.008, 0.012, t);
    }
    else { 
        // Malam (18.30 - 05.00)
        skyColor.copy(colorMalam);
        sunInt = 0.1;
        ambInt = 0.2;
        lampInt = 80;
        fogDens = 0.015;
    }

    // Override Saat Hujan
    if (params.Hujan) {
        skyColor.setHex(0x222222); // Langit kelabu gelap
        sunInt = 0.2;
        ambInt = 0.2;
        lampInt = 80; // Lampu nyala saat mendung gelap
        fogDens = 0.05;
        scene.fog.color.setHex(0x555555);
    } else {
        scene.fog.color.copy(skyColor);
    }

    scene.background = skyColor;
    scene.fog.density = fogDens;
    sunLight.intensity = sunInt;
    hemiLight.color.copy(skyColor);
    hemiLight.groundColor.copy(skyColor).multiplyScalar(0.2);
    hemiLight.intensity = ambInt;
    frontLight.intensity = lampInt;
    bottomLight.intensity = lampInt * 0.4;

    // Fireflies hanya muncul malam
    fireflySystem.visible = (jam < 5.5 || jam > 18);
}
updateMatahari();

const gui = new GUI();
const folder = gui.addFolder('Pengaturan Suasana');
folder.add(params, 'Jam', 0, 24).onChange(updateMatahari).listen();
folder.add(params, 'PutarOtomatis').listen();
folder.add(params, 'ModeNyata').name('Waktu Nyata (Sistem)').onChange((val) => {
    if (val) {
        params.PutarOtomatis = false; // Matikan putar otomatis jika mode nyata aktif
    }
});
folder.add(params, 'Hujan').name('Turun Hujan').onChange((val) => {
    rainSystem.visible = val;
    splashSystem.visible = val; // Tampilkan/sembunyikan splash
    
    // Logika Suara Hujan
    if (val) {
        if (rainSound.buffer && !rainSound.isPlaying) rainSound.play();
    } else {
        if (rainSound.isPlaying) rainSound.stop();
    }

    updateMatahari(); // Update fog
});

// const bloomFolder = gui.addFolder('Efek Cahaya (Bloom)');
// bloomFolder.add(bloomPass, 'threshold', 0.0, 1.0).name('Threshold');
// bloomFolder.add(bloomPass, 'strength', 0.0, 3.0).name('Kekuatan');
// bloomFolder.add(bloomPass, 'radius', 0.0, 1.0).name('Radius');

// Folder Navigasi Kamera
const camFolder = gui.addFolder('Sudut Pandang');

function pindahKamera(x, y, z, tx, ty, tz) {
    // Matikan auto rotate agar tidak konflik dengan animasi transisi
    controls.autoRotate = false;

    new TWEEN.Tween(camera.position).to({ x: x, y: y, z: z }, 2000).easing(TWEEN.Easing.Cubic.InOut).start();
    new TWEEN.Tween(controls.target).to({ x: tx, y: ty, z: tz }, 2000).easing(TWEEN.Easing.Cubic.InOut).start();
}

const camViews = {
    'Depan': () => pindahKamera(0, 2, 15, 0, 2, 0),
    'Samping': () => pindahKamera(15, 2, 5, 0, 2, 0),
    'Atas': () => pindahKamera(0, 25, 0, 0, 0, 0)
};
camFolder.add(camViews, 'Depan');
camFolder.add(camViews, 'Samping');
camFolder.add(camViews, 'Atas');

// Folder Fitur Lainnya
const utilFolder = gui.addFolder('Fitur Lainnya');
const utilParams = {
    Screenshot: () => {
        // Sembunyikan GUI kontrol sementara agar hasil foto bersih
        gui.domElement.style.display = 'none';

        // Gunakan html2canvas untuk memotret seluruh body (3D + UI)
        html2canvas(document.body, { useCORS: true }).then(canvas => {
            const link = document.createElement('a');
            link.download = `tongkonan_full_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Munculkan kembali GUI
            gui.domElement.style.display = 'block';
        });
    }
};
utilFolder.add(utilParams, 'Screenshot').name('Ambil Gambar');


// --- 9. LOAD MODEL ---
const loader = new GLTFLoader(loadingManager);

// OPTIMISASI: Setup Draco Loader (Untuk membaca model yang dikompresi agar lebih kecil)
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
loader.setDRACOLoader(dracoLoader);

// --- KONFIGURASI GITHUB ---
// Ganti 'USERNAME' dengan username GitHub Anda
// Ganti 'NAMA_REPO' dengan nama repository Anda
// Pastikan file .glb ada di root folder repository atau sesuaikan path-nya
// const baseUrl = 'https://cdn.jsdelivr.net/gh/USERNAME/NAMA_REPO@main/'; // <-- Gunakan ini NANTI jika sudah di-upload ke GitHub

const baseUrl = './'; // <-- Gunakan ini agar jalan di Live Server (Localhost)

// Load Rumah Adat Tongkonan
loader.load(baseUrl + 'tantor.glb', (gltf) => {
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
loader.load(baseUrl + 'kerbau4.glb', (gltf) => {
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

// Array untuk menampung semua pohon
const pohonGroup = [];

// Load Pohon Palm (di belakang dan sekitar rumah)
loader.load(baseUrl + 'pohon palm.glb', (gltf) => {
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
    pohon1.userData.windPhase = Math.random() * Math.PI;
    scene.add(pohon1);
    pohonGroup.push(pohon1);

    // Pohon 2 - Belakang kanan
    const pohon2 = pohon1.clone();
    pohon2.position.set(7, 0, -7);
    pohon2.scale.set(0.9, 0.9, 0.9);
    pohon2.userData.windPhase = Math.random() * Math.PI;
    scene.add(pohon2);
    pohonGroup.push(pohon2);

    // Pohon 3 - Samping kiri
    const pohon3 = pohon1.clone();
    pohon3.position.set(-10, 0, 2);
    pohon3.scale.set(0.7, 0.7, 0.7);
    pohon3.userData.windPhase = Math.random() * Math.PI;
    scene.add(pohon3);
    pohonGroup.push(pohon3);

    // Pohon 4 - Samping kanan
    const pohon4 = pohon1.clone();
    pohon4.position.set(9, 0, 1);
    pohon4.scale.set(0.75, 0.75, 0.75);
    pohon4.userData.windPhase = Math.random() * Math.PI;
    scene.add(pohon4);
    pohonGroup.push(pohon4);

    // Pohon 5 - Belakang tengah
    const pohon5 = pohon1.clone();
    pohon5.position.set(0, 0, -9);
    pohon5.scale.set(1.0, 1.0, 1.0);
    pohon5.userData.windPhase = Math.random() * Math.PI;
    scene.add(pohon5);
    pohonGroup.push(pohon5);
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
controls.minDistance = 5;   // Jarak minimal zoom (agar tidak tembus tembok)
controls.maxDistance = 150; // Jarak maksimal zoom (agar tidak keluar area)

// --- INTRO ANIMATION ---
let isIntroPlaying = false;

function startIntroAnimation() {
    isIntroPlaying = true;
    controls.enabled = false; // Matikan kontrol user sementara
    
    // Posisi Awal: Sangat Tinggi dan Jauh (Bird's Eye View)
    camera.position.set(0, 120, 100);
    controls.target.set(0, 2, 0);
    camera.lookAt(0, 2, 0); // Wajib: Paksa kamera melihat ke rumah agar tidak menatap ruang kosong (hitam)

    // Tween 1: Menukik turun melingkar ke sisi kanan
    const t1 = new TWEEN.Tween(camera.position)
        .to({ x: 60, y: 30, z: 40 }, 3500)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(() => camera.lookAt(0, 2, 0));

    // Tween 2: Melayang rendah menyapu bagian depan ke sisi kiri
    const t2 = new TWEEN.Tween(camera.position)
        .to({ x: -50, y: 10, z: 30 }, 3500)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(() => camera.lookAt(0, 2, 0));

    // Tween 3: Masuk perlahan ke posisi final (Depan Tengah)
    const t3 = new TWEEN.Tween(camera.position)
        .to({ x: 0, y: 5, z: 20 }, 2500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => camera.lookAt(0, 2, 0))
        .onComplete(() => {
            isIntroPlaying = false;
            controls.enabled = true;
            controls.target.set(0, 2, 0); // Set target orbit ke tengah rumah
            
            // Aktifkan auto rotate jika settingnya nyala
            if (params.PutarOtomatis && !params.ModeNyata) {
                controls.autoRotate = true;
            }
        });

    t1.chain(t2);
    t2.chain(t3);
    t1.start();
}

// === AUDIO BACKGROUND ===
const audioListener = new THREE.AudioListener();
camera.add(audioListener);

const backgroundMusic = new THREE.Audio(audioListener);
const audioAnalyser = new THREE.AudioAnalyser(backgroundMusic, 64); // Analyser untuk visualizer (32 bars)
const thunderSound = new THREE.Audio(audioListener); // Audio khusus guntur
const rainSound = new THREE.Audio(audioListener); // Audio khusus hujan
const clickSound = new THREE.Audio(audioListener); // Audio klik hotspot
// OPTIMISASI: Audio loader dipisah dari loadingManager agar visual muncul duluan (Lazy Loading)
const audioLoader = new THREE.AudioLoader(); 

audioLoader.load('./madeden_marampa.mp3', function(buffer) {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.5);
}, undefined, (err) => {
    console.warn("Musik background tidak ditemukan, melewati...", err);
});

// Load Suara Guntur
audioLoader.load('./thunder.mp3', function(buffer) {
    thunderSound.setBuffer(buffer);
    thunderSound.setVolume(1.0);
}, undefined, (err) => {
    console.warn("Suara guntur tidak ditemukan, melewati...", err);
});

// Load Suara Hujan
audioLoader.load('./rain.mp3', function(buffer) {
    rainSound.setBuffer(buffer);
    rainSound.setLoop(true); // Hujan berulang terus
    rainSound.setVolume(0.5);
}, undefined, (err) => {
    console.warn("Suara hujan tidak ditemukan, melewati...", err);
});

// Load Suara Klik
audioLoader.load('./click.mp3', function(buffer) {
    clickSound.setBuffer(buffer);
    clickSound.setVolume(0.8);
}, undefined, (err) => {
    console.warn("Suara klik tidak ditemukan, melewati...", err);
});

// --- LOGIKA FADE AUDIO (VISIBILITY CHANGE) ---
function fadeAudio(audio, targetVol, duration) {
    if (!audio || !audio.buffer) return;
    const start = { vol: audio.getVolume() };
    new TWEEN.Tween(start)
        .to({ vol: targetVol }, duration)
        .onUpdate(() => audio.setVolume(start.vol))
        .start();
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Fade Out saat pindah tab / minimize
        fadeAudio(backgroundMusic, 0, 1500);
        fadeAudio(rainSound, 0, 1500);
    } else {
        // Fade In saat kembali
        fadeAudio(backgroundMusic, 0.5, 1500); // Kembali ke volume 0.5
        if (params.Hujan) fadeAudio(rainSound, 0.5, 1500);
    }
});

// Stop audio instan saat tab ditutup (Browser tidak mengizinkan animasi saat close)
window.addEventListener('beforeunload', () => {
    if (backgroundMusic.isPlaying) backgroundMusic.setVolume(0);
    if (rainSound.isPlaying) rainSound.setVolume(0);
});

function resumeAudioContext() {
    if (audioListener.context.state === 'suspended') {
        audioListener.context.resume();
    }
    if (backgroundMusic.buffer && !backgroundMusic.isPlaying) {
        backgroundMusic.play();
    }
    // Resume suara hujan jika sedang aktif
    if (params.Hujan && rainSound.buffer && !rainSound.isPlaying) {
        rainSound.play();
    }
}

window.addEventListener('click', resumeAudioContext);
window.addEventListener('keydown', resumeAudioContext);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // composer.setSize(window.innerWidth, window.innerHeight);
    // composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const clock = new THREE.Clock();

// --- 11. ANIMASI BURUNG (PROCEDURAL) ---
const birds = [];
function setupBirds() {
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide });
    // Geometri Sayap (Pivot diatur agar mengepak dari badan)
    const wingGeoR = new THREE.PlaneGeometry(0.5, 0.2);
    wingGeoR.translate(0.25, 0, 0); 
    const wingGeoL = new THREE.PlaneGeometry(0.5, 0.2);
    wingGeoL.translate(-0.25, 0, 0); 

    for (let i = 0; i < 25; i++) {
        const bird = new THREE.Group();
        const wingR = new THREE.Mesh(wingGeoR, birdMat);
        const wingL = new THREE.Mesh(wingGeoL, birdMat);
        
        wingR.name = 'wingR';
        wingL.name = 'wingL';
        
        bird.add(wingR);
        bird.add(wingL);

        // Posisi Acak di Langit
        bird.position.set(
            (Math.random() - 0.5) * 200,
            30 + Math.random() * 20, // Ketinggian 30-50
            (Math.random() - 0.5) * 200
        );

        // Kecepatan & Arah Acak
        const speed = 0.2 + Math.random() * 0.2;
        bird.userData = {
            velocity: new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5).normalize().multiplyScalar(speed),
            wingSpeed: 8 + Math.random() * 5
        };
        
        bird.lookAt(bird.position.clone().add(bird.userData.velocity));
        scene.add(bird);
        birds.push(bird);
    }
}
setupBirds();

function updateBirds(time) {
    birds.forEach(bird => {
        // Gerakan Maju
        bird.position.add(bird.userData.velocity);
        
        // Animasi Kepakan Sayap
        const wingR = bird.getObjectByName('wingR');
        const wingL = bird.getObjectByName('wingL');
        if (wingR && wingL) {
            wingR.rotation.z = Math.sin(time * bird.userData.wingSpeed) * 0.5;
            wingL.rotation.z = -Math.sin(time * bird.userData.wingSpeed) * 0.5;
        }

        // Reset posisi jika terbang terlalu jauh (Looping)
        if (bird.position.distanceTo(new THREE.Vector3(0,0,0)) > 150) {
            bird.position.set((Math.random()-0.5)*200, 30+Math.random()*20, (Math.random()-0.5)*200);
            bird.userData.velocity = new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5).normalize().multiplyScalar(0.2 + Math.random()*0.2);
            bird.lookAt(bird.position.clone().add(bird.userData.velocity));
        }
    });
}

// --- 12. EFEK PETIR & GEMPA KAMERA ---
const lightningLight = new THREE.PointLight(0xccccff, 0, 10000);
lightningLight.position.set(0, 80, 0);
scene.add(lightningLight);

let shakeIntensity = 0;
let flashFogIntensity = 0; // Variabel untuk ketebalan kabut kilat
let nextLightningTime = 10; // Waktu petir pertama

function triggerLightning() {
    lightningLight.intensity = 800; // Kilatan terang
    shakeIntensity = 0.8; // Kekuatan guncangan
    flashFogIntensity = 1.0; // Kabut menjadi sangat tebal seketika

    // Mainkan suara guntur jika sudah dimuat
    if (thunderSound.buffer) {
        if (thunderSound.isPlaying) thunderSound.stop(); // Reset jika masih bunyi
        thunderSound.play();
    }
}

// --- 13. EFEK TETESAN AIR DI LENSA (HUD) ---
const canvasLens = document.createElement('canvas');
canvasLens.id = 'lens-effect';
canvasLens.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:50;';
document.body.appendChild(canvasLens);
const ctxLens = canvasLens.getContext('2d');

let lensDroplets = [];
const maxLensDroplets = 30; // Maksimal jumlah tetesan di layar

function resizeLensCanvas() {
    canvasLens.width = window.innerWidth;
    canvasLens.height = window.innerHeight;
}
window.addEventListener('resize', resizeLensCanvas);
resizeLensCanvas();

function updateLensDroplets(dt) {
    ctxLens.clearRect(0, 0, canvasLens.width, canvasLens.height);

    if (!params.Hujan) {
        lensDroplets = []; // Hapus tetesan jika tidak hujan
        return;
    }

    // Spawn tetesan baru secara acak
    if (lensDroplets.length < maxLensDroplets && Math.random() < 2 * dt) {
        lensDroplets.push({
            x: Math.random() * canvasLens.width,
            y: Math.random() * canvasLens.height,
            size: 10 + Math.random() * 30,
            life: 1.0,
            speedY: 10 + Math.random() * 20
        });
    }

    // Update & Gambar Tetesan
    for (let i = lensDroplets.length - 1; i >= 0; i--) {
        const d = lensDroplets[i];
        d.y += d.speedY * dt; // Gerak turun
        d.life -= 0.2 * dt;   // Memudar perlahan

        if (d.life <= 0) {
            lensDroplets.splice(i, 1);
            continue;
        }

        // Gambar Tetesan (Gradient Radial agar terlihat seperti air)
        const grd = ctxLens.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.size);
        grd.addColorStop(0, `rgba(255, 255, 255, 0)`);       // Tengah transparan
        grd.addColorStop(0.8, `rgba(255, 255, 255, ${0.2 * d.life})`); // Pinggir putih pudar
        grd.addColorStop(1, `rgba(255, 255, 255, 0)`);       // Luar transparan

        ctxLens.fillStyle = grd;
        ctxLens.beginPath();
        ctxLens.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctxLens.fill();
        
        // Kilauan Kecil (Highlight)
        ctxLens.fillStyle = `rgba(255, 255, 255, ${0.4 * d.life})`;
        ctxLens.beginPath();
        ctxLens.arc(d.x - d.size*0.2, d.y - d.size*0.2, d.size*0.15, 0, Math.PI * 2);
        ctxLens.fill();
    }
}

// --- 13.1 VISUALIZER MUSIK (GELOMBANG SUARA) ---
const canvasViz = document.createElement('canvas');
canvasViz.width = 300; canvasViz.height = 60;
canvasViz.style.cssText = 'position:absolute; bottom:20px; left:20px; width:300px; height:60px; pointer-events:none; z-index:40; opacity:0.9;';
document.body.appendChild(canvasViz);
const ctxViz = canvasViz.getContext('2d');


// --- 14. KONTROL JOYSTICK (MOBILE) ---
const joyContainer = document.createElement('div');
joyContainer.id = 'joystick-container';
joyContainer.style.cssText = 'position: absolute; bottom: 40px; left: 40px; width: 120px; height: 120px; background: rgba(255, 255, 255, 0.1); border: 2px solid rgba(255, 215, 0, 0.5); border-radius: 50%; z-index: 1000; touch-action: none; display: none; backdrop-filter: blur(5px);';
const joyKnob = document.createElement('div');
joyKnob.style.cssText = 'position: absolute; top: 50%; left: 50%; width: 50px; height: 50px; background: rgba(255, 215, 0, 0.8); border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);';
joyContainer.appendChild(joyKnob);
document.body.appendChild(joyContainer);

// Deteksi perangkat sentuh (Tampilkan joystick jika di HP/Tablet)
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    joyContainer.style.display = 'block';
}

let joyData = { x: 0, y: 0, active: false };
const maxRadius = 60; // Setengah dari width container

joyContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joyData.active = true;
    updateJoystick(e.touches[0]);
});

joyContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (joyData.active) updateJoystick(e.touches[0]);
});

const endJoystick = () => {
    joyData.active = false;
    joyData.x = 0;
    joyData.y = 0;
    joyKnob.style.transform = `translate(-50%, -50%)`;
};

joyContainer.addEventListener('touchend', endJoystick);
joyContainer.addEventListener('touchcancel', endJoystick);

function updateJoystick(touch) {
    const rect = joyContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    if (distance > maxRadius) {
        const ratio = maxRadius / distance;
        dx *= ratio;
        dy *= ratio;
    }
    
    joyData.x = dx / maxRadius; 
    joyData.y = dy / maxRadius; 
    
    joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta(); // Hitung selisih waktu antar frame
    const time = clock.getElapsedTime();
    TWEEN.update();
    
    // Update Animasi Burung
    updateBirds(time);

    // Update Efek Tetesan Lensa
    updateLensDroplets(delta);

    // Update Animasi Bayangan Awan
    cloudTexture.offset.x = time * 0.02; // Gerakan angin X
    cloudTexture.offset.y = time * 0.005; // Gerakan angin Y

    // Update Visualizer Musik
    ctxViz.clearRect(0, 0, canvasViz.width, canvasViz.height);
    if (backgroundMusic.isPlaying) {
        const data = audioAnalyser.getFrequencyData(); // Ambil data frekuensi (0-255)
        const barWidth = canvasViz.width / data.length;
        
        ctxViz.fillStyle = '#FFD700'; // Warna Emas
        ctxViz.shadowBlur = 10;
        ctxViz.shadowColor = '#FFD700';

        for (let i = 0; i < data.length; i++) {
            const value = data[i];
            const percent = value / 255;
            const height = percent * canvasViz.height;
            // Gambar bar (x, y, w, h)
            ctxViz.fillRect(i * barWidth + 2, canvasViz.height - height, barWidth - 4, height);
        }
        ctxViz.shadowBlur = 0; // Reset shadow
    }

    if (params.ModeNyata) {
        const now = new Date();
        params.Jam = now.getHours() + (now.getMinutes() / 60);
        updateMatahari();
    } else if (params.PutarOtomatis) {
        params.Jam += 0.03;
        if (params.Jam > 24) params.Jam = 0;
        updateMatahari();
    }

    // Animasi Hujan Jatuh
    if (params.Hujan && rainSystem.visible) {
        const positions = rainSystem.geometry.attributes.position.array;
        const splashPositions = splashSystem.geometry.attributes.position.array;

        for(let i=1; i<rainCount*3; i+=3){
            positions[i] -= 0.9; // Kecepatan jatuh dipercepat
            if (positions[i] < 0) {
                // --- LOGIKA CIPRATAN ---
                // Ambil partikel splash berikutnya dari antrian
                const k = splashIndex;
                splashPositions[k*3] = positions[i-1];     // Posisi X sama dengan hujan
                splashPositions[k*3+1] = 0;                // Posisi Y di tanah
                splashPositions[k*3+2] = positions[i+1];   // Posisi Z sama dengan hujan
                splashLife[k] = 1.0; // Reset umur cipratan (1.0 = baru)
                
                splashIndex = (splashIndex + 1) % splashCount; // Geser index (circular buffer)

                positions[i] = 60; // Reset hujan ke atas
            }
        }
        rainSystem.geometry.attributes.position.needsUpdate = true;

        // Animasi Partikel Cipratan
        for(let i=0; i<splashCount; i++){
            if(splashLife[i] > 0){
                splashLife[i] -= 0.2; // Kurangi umur dengan cepat
                splashPositions[i*3+1] += 0.1; // Gerak memantul naik
            } else {
                splashPositions[i*3+1] = -100; // Sembunyikan jika umur habis
            }
        }
        splashSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Animasi Kunang-Kunang
    if (fireflySystem.visible) {
        const positions = fireflySystem.geometry.attributes.position.array;
        const colors = fireflySystem.geometry.attributes.color.array;

        for(let i=0; i<fireflyCount; i++){
            // Gerakan melayang halus (sinusoidal)
            positions[i*3] += Math.cos(time * 0.5 + i) * 0.02;      // Gerak X
            positions[i*3+1] += Math.sin(time * 2 + i) * 0.005;     // Gerak Y (Naik turun dikit)
            positions[i*3+2] += Math.sin(time * 0.5 + i) * 0.02;    // Gerak Z

            // Efek Berkedip (Sinusoidal)
            const blink = (Math.sin(time * 3 + fireflyPhase[i]) + 1) * 0.5; // Nilai 0 sampai 1
            colors[i*3] = 0.8 * blink;   // Redupkan R
            colors[i*3+1] = 1.0 * blink; // Redupkan G
            colors[i*3+2] = 0.0;         // B tetap 0
        }
        fireflySystem.geometry.attributes.position.needsUpdate = true;
        fireflySystem.geometry.attributes.color.needsUpdate = true;
    }

    // Efek Angin pada Pohon
    const windStrength = params.Hujan ? (0.03 + shakeIntensity * 0.05) : 0;
    pohonGroup.forEach(pohon => {
        const phase = pohon.userData.windPhase || 0;
        // Target rotasi berdasarkan angin
        const targetRotX = Math.sin(time * 1.5 + phase) * windStrength;
        const targetRotZ = Math.cos(time * 1.2 + phase) * windStrength * 0.5;

        // Interpolasi halus (lerp) ke target rotasi
        pohon.rotation.x += (targetRotX - pohon.rotation.x) * 0.05;
        pohon.rotation.z += (targetRotZ - pohon.rotation.z) * 0.05;
    });

    hotspots.forEach(h => {
        h.position.y = h.userData.initialY + Math.sin(time * 2.5) * 0.08;

        // Efek Berdenyut (Pulsating) agar menarik perhatian
        const scale = 0.6 + Math.sin(time * 3) * 0.07; 
        h.scale.set(scale, scale, 1);
    });

    // Logika Petir (Hanya saat hujan)
    if (params.Hujan) {
        if (time > nextLightningTime) {
            triggerLightning();
            nextLightningTime = time + 8 + Math.random() * 10; // Interval petir acak (8-18 detik)
        }
    } else {
        nextLightningTime = time + 5; // Reset timer jika tidak hujan
    }

    // Efek Kilatan Pudar
    if (lightningLight.intensity > 0) {
        lightningLight.intensity *= 0.85; // Redup cepat
    }

    // Efek Kabut Tebal Pasca Petir
    if (flashFogIntensity > 0) {
        flashFogIntensity -= 0.02; // Kabut menipis perlahan kembali ke normal
        if (flashFogIntensity <= 0) {
            flashFogIntensity = 0;
            // Kembalikan ke settingan normal hujan saat efek selesai
            if (params.Hujan) scene.fog.density = 0.05;
        } else if (params.Hujan) {
            // Interpolasi: Semakin tinggi intensity, semakin dekat jarak pandang (kabut tebal)
            scene.fog.density = 0.05 + (0.1 * flashFogIntensity); // Tambah density saat kilat
        }
    }

    // Logika Pergerakan Joystick
    if (joyData.active) {
        const speed = 0.3; // Kecepatan gerak
        
        // Vektor arah depan kamera (di proyeksikan ke tanah)
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        
        // Vektor arah kanan kamera
        const right = new THREE.Vector3();
        right.crossVectors(forward, camera.up).normalize();
        
        // Hitung pergerakan (Maju/Mundur & Kiri/Kanan)
        const moveVector = new THREE.Vector3()
            .addScaledVector(forward, -joyData.y * speed)
            .addScaledVector(right, joyData.x * speed);
            
        
        // --- LOGIKA BATAS GERAK (COLLISION) ---
        const nextPos = camera.position.clone().add(moveVector);
        
        // 1. Cek Batas Luar (Area Tanah - Radius 120)
        const dist = Math.sqrt(nextPos.x**2 + nextPos.z**2);
        if (dist > 120) return; // Batal gerak jika keluar area

        // 2. Cek Tabrakan Rumah (Bounding Box)
        // Area rumah kira-kira X: -5 s/d 5, Z: -8 s/d 8
        if (nextPos.x > -5 && nextPos.x < 5 && nextPos.z > -8 && nextPos.z < 8) {
            return; // Batal gerak jika menabrak tembok rumah
        }

        camera.position.add(moveVector);
        controls.target.add(moveVector);
    }

    // Batasi Panning Desktop (agar target tidak geser keluar area)
    if (controls.target.length() > 120) controls.target.setLength(120);

    if (!isIntroPlaying) controls.update(); // Hanya update kontrol jika intro tidak sedang jalan
    
    // Efek Guncangan Kamera (Shake)
    if (shakeIntensity > 0) {
        const originalPos = camera.position.clone(); // Simpan posisi asli
        const noise = 0.5 * shakeIntensity;
        camera.position.add(new THREE.Vector3((Math.random()-0.5)*noise, (Math.random()-0.5)*noise, (Math.random()-0.5)*noise));
        shakeIntensity -= 0.02; // Kurangi guncangan perlahan
        renderer.render(scene, camera);
        camera.position.copy(originalPos); // Kembalikan posisi asli
    } else {
        renderer.render(scene, camera);
    }
}
animate();
