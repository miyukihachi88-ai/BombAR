//========================================
// 爆弾データ
//========================================
alert("script.jsが読み込まれました！");
const bombs = [
    { lat: 35.72718, lng: 139.54135, found: false },
    { lat: 35.7369370, lng: 139.5379070, found: false },
    { lat: 35.7370520, lng: 139.5379470, found: false },
    { lat: 35.7372480, lng: 139.5379070, found: false },
    { lat: 35.7374780, lng: 139.5380800, found: false },
    { lat: 35.7377030, lng: 139.5381000, found: false },
    { lat: 35.7379340, lng: 139.5380610, found: false },
    { lat: 35.7381540, lng: 139.5381830, found: false },
    { lat: 35.7385610, lng: 139.5382710, found: false },
    { lat: 35.7387890, lng: 139.5382920, found: false },
    { lat: 35.7391540, lng: 139.5383530, found: false },
    { lat: 35.7395860, lng: 139.5386660, found: false },
    { lat: 35.7398670, lng: 139.5385810, found: false },
    { lat: 35.7400570, lng: 139.5385970, found: false },
    { lat: 35.7402650, lng: 139.5385850, found: false },
    { lat: 35.7404700, lng: 139.5387010, found: false },
    { lat: 35.7408010, lng: 139.5385470, found: false }
];
//========================================
// グローバル変数
//========================================
let bombEntities = [];
let showMap = false;
let smoothedLat = null;
let smoothedLng = null;
//========================================
// HTML取得
//========================================
const distanceUI = document.getElementById("distanceUI");
const foundUI = document.getElementById("foundUI");
const mapImg = document.getElementById("mapImg");
const mapCanvas = document.getElementById("mapCanvas");
const toggleMap = document.getElementById("toggleMap");
const ctx = mapCanvas.getContext("2d");
//========================================
// スムージング
//========================================
function smooth(current, previous){
    if(previous === null){
        return current;
    }
    return previous + (current - previous) * 0.03;
}
//========================================
// 初期化
//========================================
window.onload = () => {
    initializeUI();
    createBombs();
    startGPS();
};
//========================================
// UI初期設定
//========================================
function initializeUI() {

    mapCanvas.style.display = "none";
    mapImg.style.display = "none";
    toggleMap.innerText = "MAP ON";

    toggleMap.onclick = () => {

        showMap = !showMap;

        mapCanvas.style.display = showMap ? "block" : "none";
        toggleMap.innerText = showMap ? "MAP OFF" : "MAP ON";

        if (showMap) {
            drawMiniMap();
        }
    };

    // 地図画像の読み込みが完了したら再描画
    mapImg.addEventListener("load", () => {
        if (showMap) {
            drawMiniMap();
        }
    });

    mapImg.addEventListener("error", () => {
        alert("地図画像の読み込みに失敗しました。map.pngを確認してください。");
    });
}
//========================================
// 爆弾生成
//========================================
function createBombs(){
    const scene = document.querySelector("a-scene");
    bombs.forEach((bomb, index)=>{
        const bombEntity =
            document.createElement("a-entity");
        bombEntity.setAttribute(
            "gps-entity-place",
            `latitude:${bomb.lat}; longitude:${bomb.lng}`);
        bombEntity.setAttribute("gltf-model", "#bombModel");
        bombEntity.setAttribute("scale", "2 2 2");
        bombEntity.setAttribute("visible", "false");
        //----------------------------
        // 光るリング
        //----------------------------
        const ring =
            document.createElement("a-ring");
        ring.setAttribute("radius-inner","2");
        ring.setAttribute("radius-outer","3");
        ring.setAttribute("rotation","-90 0 0");
        ring.setAttribute("material","color:yellow; emissive:yellow; emissiveIntensity:3");
        bombEntity.appendChild(ring);
        bombEntity.ring = ring;
        //----------------------------
        // 保存
        //----------------------------
        scene.appendChild(bombEntity);
        bombEntities.push(bombEntity);
    });
}
//========================================
// GPS開始
//========================================
function startGPS() {
    navigator.geolocation.watchPosition(
        
        updateGPS,
        (error) => {
            alert("GPSが取得できません");
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );
}
//========================================
// GPS更新
//========================================
let lastUpdate = 0;
function updateGPS(position) {

    if (position.coords.accuracy > 10) {
        return;
    }

    if (Date.now() - lastUpdate < 1000) {
        return;
    }

    lastUpdate = Date.now();

    smoothedLat = smooth(position.coords.latitude, smoothedLat);
    smoothedLng = smooth(position.coords.longitude, smoothedLng);
    let nearestDistance = Infinity;
    bombs.forEach((bomb, index) => {
        const distance = getDistance(
            smoothedLat,
            smoothedLng,
            bomb.lat,
            bomb.lng
        );
        const bombEntity = bombEntities[index];
        if (!bomb.found && distance < nearestDistance) {
            nearestDistance = distance;
        }
        //--------------------------
        // 10m以内で表示
        //--------------------------
        if (distance <= 20) {

    bombEntity.setAttribute("visible", true);
    bombEntity.ring.setAttribute("visible", !bomb.found);

    keepBombAtMinimumDistance(bombEntity, 5);

} else if (distance > 25) {

    bombEntity.setAttribute("visible", false);
    bombEntity.ring.setAttribute("visible", false);
}
    });
    //--------------------------
    // 距離表示
    //--------------------------
    if (nearestDistance === Infinity) {
        distanceUI.innerText = "クリア！";
    }
    else {
        distanceUI.innerText =
            "あと " + Math.floor(nearestDistance) + " m";
    }
    //--------------------------
    // ミニマップ更新
    //--------------------------
    if (showMap) {
        drawMiniMap();
    }
}

//========================================
// 爆弾発見
//========================================
function handleFound(index) {
    const bomb = bombs[index];
    if (bomb.found) return;
    bomb.found = true;
    const bombEntity = bombEntities[index];
    //--------------------------
    // 光だけ消す
    //--------------------------
    bombEntity.ring.setAttribute("visible", false);
    bombEntity.removeAttribute("animation");
    bombEntity.setAttribute("scale", "2 2 2");
    //--------------------------
    // 残り個数
    //--------------------------
    const remaining =
        bombs.filter(b => !b.found).length;
    //--------------------------
    // メッセージ
    //--------------------------
    if (remaining === 0) {
        foundUI.innerText = "🎉クリア！";
    }
    else {
        foundUI.innerText =
            `発見！\nあと ${remaining} 個`;
    }
    foundUI.style.display = "block";
    if (remaining !== 0) {
        setTimeout(() => {
            foundUI.style.display = "none";
        }, 1500);
    }
}
//========================================
// タップ判定
//========================================
document.addEventListener("click", () => {
    let nearestDistance = Infinity;
    let nearestIndex = -1;
    bombs.forEach((bomb, index) => {
        if (bomb.found) return;
        const distance = getDistance(
            smoothedLat,
            smoothedLng,
            bomb.lat,
            bomb.lng
        );
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
        }
    });
    if (nearestDistance <= 20) {
        handleFound(nearestIndex);
    }
});
//========================================
// 距離計算
//========================================
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat =
        (lat2 - lat1) * Math.PI / 180;
    const dLng =
        (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );
}
//========================================
// ミニマップ設定
//========================================
const mapMinLat = 35.7363019589325; 
const mapMaxLat = 35.7409743083018;
const mapMinLng = 139.53586708062625;
const mapMaxLng = 139.53958571726383; 

//========================================
// ミニマップ描画
//========================================
function drawMiniMap(){
    if (!mapImg.complete || mapImg.naturalWidth === 0) {
            return;
        }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    mapCanvas.width = 220;
    mapCanvas.height = 336;
    ctx.clearRect(0,0,mapCanvas.width,mapCanvas.height);
    //----------------------------------
    // 地図画像
    //----------------------------------
    ctx.drawImage(
        mapImg,0,0,mapCanvas.width,mapCanvas.height
    );
    //----------------------------------
    // 爆弾
    //----------------------------------
    bombs.forEach((bomb)=>{
        const x =
            (bomb.lng-mapMinLng)/
            (mapMaxLng-mapMinLng)*
            mapCanvas.width;
        const y =
            mapCanvas.height-
            (bomb.lat-mapMinLat)/
            (mapMaxLat-mapMinLat)*
            mapCanvas.height;
        ctx.beginPath();
        ctx.arc(x,y,5,0,Math.PI*2);
        ctx.fillStyle =
            bomb.found ? "#00ff00" : "#ff0000";
        ctx.fill();
    });
    //----------------------------------
    // 現在地
    //----------------------------------
    drawPlayer();
}
//========================================
// 現在地（三角）
//========================================
function drawPlayer(){
    if(smoothedLat==null) return;
    const x = Math.max(
        0,
        Math.min(
            mapCanvas.width,
            (smoothedLng-mapMinLng)/
            (mapMaxLng-mapMinLng)*
            mapCanvas.width
        )
    );

    const y = Math.max(
        0,
        Math.min(
            mapCanvas.height,
            mapCanvas.height-
            (smoothedLat-mapMinLat)/
            (mapMaxLat-mapMinLat)*
            mapCanvas.height
        )
    );
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate((playerHeading - 90) * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(0,-12);
    ctx.lineTo(-8,10);
    ctx.lineTo(8,10);
    ctx.closePath();
    ctx.fillStyle = "#0080ff";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}
function keepBombAtMinimumDistance(bombEntity, minDistance = 5) {

    const camera = document.querySelector("a-camera");

    if (!camera) return;

    const cameraPos = new THREE.Vector3();
    const bombPos = new THREE.Vector3();

    camera.object3D.getWorldPosition(cameraPos);
    bombEntity.object3D.getWorldPosition(bombPos);

    const direction = bombPos.clone().sub(cameraPos);
    const distance = direction.length();

    if (distance < 0.01 || distance >= minDistance) return;

    direction.normalize();

    const targetWorldPos = cameraPos.clone().add(
        direction.multiplyScalar(minDistance)
    );

    const parent = bombEntity.object3D.parent;

    if (!parent) return;

    parent.updateMatrixWorld(true);
    bombEntity.object3D.position.copy(
        parent.worldToLocal(targetWorldPos)
    );
}
//========================================
// 方位取得
//========================================
let playerHeading = 0;
window.addEventListener("deviceorientation",(event)=>{
    if(event.alpha!=null){
        playerHeading = event.alpha;
    }
});