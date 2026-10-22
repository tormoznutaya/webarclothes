import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

const container = document.getElementById('canvas-container');
const loadingText = document.getElementById('loading');
const controlsDiv = document.getElementById('controls');

// 1. Сцена и Камера
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 3);

// 2. Рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// Включаем поддержку WebXR (дополненной реальности)
renderer.xr.enabled = true;
container.appendChild(renderer.domElement);

// 3. Свет
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// 4. Управление для обычного режима (на ПК)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// 5. Группа для манекена (чтобы было удобно двигать)
let mannequinGroup = new THREE.Group();
scene.add(mannequinGroup);

let pantsModel = null;
const loader = new GLTFLoader();

// Загружаем Манекен
loader.load('./models/mannequin.glb', function (gltf) {
    const model = gltf.scene;
    
    // Ставим манекен на пол (Y = 0)
    const box = new THREE.Box3().setFromObject(model);
    model.position.y -= box.min.y; 
    model.position.x -= (box.max.x + box.min.x) / 2;
    model.position.z -= (box.max.z + box.min.z) / 2;

    mannequinGroup.add(model);
    checkAllLoaded();
});

// Загружаем Штаны
loader.load('./models/pants.glb', function (gltf) {
    pantsModel = gltf.scene;
    
    // Спускаем штаны ниже (попробуйте изменить 0.6, если нужно)
    pantsModel.position.set(0, 0.6, 0); 
    
    pantsModel.visible = false;
    mannequinGroup.add(pantsModel);
    checkAllLoaded();
});

function checkAllLoaded() {
    if (mannequinGroup.children.length >= 2) {
        loadingText.style.display = 'none';
        controlsDiv.style.display = 'block';
    }
}

document.getElementById('btn-pants').addEventListener('click', () => {
    if (pantsModel) pantsModel.visible = !pantsModel.visible;
});

// 6. НАСТРОЙКА AR (Дополненной реальности)
// Создаем кнопку AR, которая появится на экране
const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
document.body.appendChild(arButton);

// Обработка изменения размера
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 7. Цикл отрисовки (работает и в обычном режиме, и в AR)
renderer.setAnimationLoop(function () {
    if (renderer.xr.isPresenting) {
        // Если мы в AR режиме, ничего не вращаем, камера двигается сама
    } else {
        // В обычном режиме (на ПК) работает мышка
        controls.update();
    }
    renderer.render(scene, camera);
});
