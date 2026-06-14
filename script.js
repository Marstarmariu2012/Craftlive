let gras, wildkarotenblock, blume, karote, baumUnten, baumOben;
let himbeer1Img, himbeer2Img, himbeer3Img, himbeer4Img, himbeer5Img, himbeer6Img;
let himbeereSammeln, acker, axtImg, hacke, bretter, karots1, karots2;
let zaunblock, zauninventarImg, schafBack, schafFront;
let goldImg;
let steininventar;
let spitzhacke;
let steinblock;
let messerImg;
let rohschaffleischImg;
let feuersteinImg;
let inventarholz, beeImg, haendlerUp, haendlerDown;
let schafHunger = 400; 

let letzteZeit = 0, letzteZeitHealth = 0;
let haendler = {};
let haendlerChat = false;
let haendlerInput = '';
let haendlerVerlauf = [];
let haendlerWartet = false;
let letzterDeal = null;

const WARENWERT = {
    'gold':1,'schafe':3,'kühe':3,'schweine':3,
    'wolle':7,'milch':7,'rohschaffleisch':7,
    'feuerstein':10,'steininventar':11,
    'bretter':15,'holz':20,'zaun':20,
    'inventarholz':21,'karote':15,'himbeere':17,'zauninventar':18,
    'messer':6,'spitzhacke':5
};

let blockPflanzzeit = {};
let hunger = 200, health = 200;
let kameraX = 0, kameraY = 0;
let chunks = {};
let richtung = 'oben';
let inventar = new Array(8).fill(null);
let aktiverSlot = 0;
let craftingOffen = false;
let ausgewähltesRezept = null;
let baumHinweis = '';
let baumHinweisBis = 0;
let baumZiehAktiv = false;
let baumTragend = null;
let schafe = [];

let npcX = 300, npcY = 300;
let npcRichtungX = 1, npcRichtungY = 0, npcTimer = 0;
    
let rezepte = [
    { name:'zauninventar', bild:null, zutaten:[{typ:'bretter',anzahl:2},{typ:'inventarholz',anzahl:2}], ergebnis:1 },
    { name:'axt',          bild:null, zutaten:[{typ:'inventarholz',anzahl:3}], ergebnis:1 },
    {name:'messer', bild:null,zutaten:[{typ:'inventarholz}',anzahl:1},{typ:'steininventar',anzahl:1}],ergebnis:1},
    { name:'hacke',        bild:null, zutaten:[{typ:'inventarholz',anzahl:2},{typ:'steininventar',anzahl:2}], ergebnis:1 },
    { name:'spitzhacke',   bild:null, zutaten:[{typ:'inventarholz',anzahl:2},{typ:'steininventar',anzahl:3}], ergebnis:1 },
];

let blockTypen = {
    1:'gras',2:'blume',3:'baum_unten',4:'baum_oben',
    5:'himbeer1',6:'himbeer2',7:'himbeer3',8:'himbeer4',9:'himbeer5',10:'himbeer6',
    11:'wildkarotenblock',12:'acker',13:'karots1',14:'karots2',15:'zaunblock',16:'steinblock'
};
let himbeerAnzahl = { 5:1,6:2,7:3,8:4,9:5,10:6 };

function preload() {
    blume           = loadImage('flower_block1.png');
    beeImg          = loadImage('bee.png');
    gras            = loadImage('gras.png');
    baumUnten       = loadImage('baum1.png');
    steininventar = loadImage('steininventar.png');
    steinblock = loadImage('steinblock.png');
    spitzhacke = loadImage('spitzhacke.png');
    feuersteinImg   = loadImage('feuerstein.png');
    baumOben        = loadImage('baum2.png');
    hacke           = loadImage('hacke.png');
    karote          = loadImage('karote.png');
    messerImg       = loadImage('messer.png');
    rohschaffleischImg = loadImage('rohschaffleisch.png');
    zaunblock       = loadImage('zaun.png');
    inventarholz    = loadImage('inventarholz.png');
    himbeer1Img     = loadImage('rasspberys1.png');
    himbeer2Img     = loadImage('rasspberys2.png');
    himbeer3Img     = loadImage('rasspberys3.png');
    acker           = loadImage('acker.png');
    zauninventarImg = loadImage('zauninventar.png');
    himbeer4Img     = loadImage('rasspberys4.png');
    himbeer5Img     = loadImage('rasspberys5.png');
    himbeer6Img     = loadImage('rasspberys6.png');
    goldImg         = loadImage('goldinventar.png');
    bretter         = loadImage('bretter.png');
    himbeereSammeln = loadImage('rasspbery.png');
    wildkarotenblock= loadImage('wildkarote.png');
    axtImg          = loadImage('axt.png');
    karots1         = loadImage('karots1.png');
    karots2         = loadImage('karots2.png');
    schafBack       = loadImage('schafback.png');
    schafFront      = loadImage('schaffront.png');
    haendlerUp      = loadImage('händlerup.png');
    haendlerDown    = loadImage('händelerdown.png');
}

function setup() {
    createCanvas(1920, 1080);
    noSmooth();
    inventar[0] = { typ:'axt', anzahl:1 };
    inventar[1] = { typ:'messer', anzahl:1 };
    inventar[2] = { typ:'spitzhacke', anzahl:1 };
    rezepte[0].bild = zauninventarImg;
    rezepte[2].bild = messerImg;
    rezepte[1].bild = axtImg;
    rezepte[4].bild = spitzhacke;
    rezepte[3].bild = hacke;
    haendler = { x:500, y:500, richtungX:1, richtungY:0, timer:0, schritt:0 };
}

function draw() {
    background(255);
    calkulatehunger();
    calkulatehealth();

    for (let k in blockPflanzzeit) {
        let vergangen = millis() - blockPflanzzeit[k];
        let teile = k.split('_blockIndex_');
        let chunkId = teile[0];
        let blockIndex = int(teile[1]);
        if (vergangen >= 1200000 && chunks[chunkId] && chunks[chunkId][blockIndex] === 12) chunks[chunkId][blockIndex] = 13;
        if (vergangen >= 2400000 && chunks[chunkId] && chunks[chunkId][blockIndex] === 13) chunks[chunkId][blockIndex] = 14;
    }

    if (!haendlerChat) {
        if (keyIsDown(87)) { if (!istZaun(kameraX, kameraY + 5)) { kameraY += 5; richtung = 'oben'; }}
        if (keyIsDown(83)) { if (!istZaun(kameraX, kameraY - 5)) { kameraY -= 5; richtung = 'unten'; }}
        if (keyIsDown(68)) { if (!istZaun(kameraX - 5, kameraY)) { kameraX -= 5; richtung = 'rechts'; }}
        if (keyIsDown(65)) { if (!istZaun(kameraX + 5, kameraY)) { kameraX += 5; richtung = 'links'; }}
    }

    let { cx, cy } = welcherChunk();
    let chunkBreite = 19 * 100, chunkHöhe = 9 * 100;

    push();
    translate(kameraX, kameraY);
    for (let x = cx - 1; x <= cx + 1; x++) {
        for (let y = cy - 1; y <= cy + 1; y++) {
            zeichneChunk('chunk_' + x + '_' + y, x * chunkBreite, y * chunkHöhe);
        }
    }
    pop();

    push();
    translate(kameraX, kameraY);
    imageMode(CENTER);
    image(beeImg, npcX, npcY, 50, 50);
    pop();

    updateNpc();
    updateSchafe();
    drawSchafe();
    updateHaendler();
    drawHaendler();
    drawFadenkreuz();
    if (baumZiehAktiv) drawZiehtBaum();
    if (baumHinweisBis > millis()) {
        push();
        textAlign(CENTER);
        fill(255, 245, 180);
        stroke(0, 0, 0, 180);
        strokeWeight(2);
        textSize(18);
        text(baumHinweis, width/2, 40);
        pop();
    }

    fill(255,0,0); noStroke(); rectMode(CORNER);
    rect(width/2 - 25, height/2 - 25, 50, 50);

    drawhunger();
    drawhealth();
    drawInventar();
    drawCrafting();
    drawHaendlerChat();
}

function generiereChunk(chunkId) {
    if (chunks[chunkId]) return chunks[chunkId];
    let blöcke = new Array(171).fill(1);
    for (let i = 0; i < 171; i++) {
        let zufall = random(100);
        if (zufall < 30)      blöcke[i] = 1;
        else if (zufall < 50) blöcke[i] = 2;
        else if (zufall < 70) blöcke[i] = 2;
        else if (zufall < 95) blöcke[i] = 1;
        else if (zufall < 97) blöcke[i] = 11;
        else if (zufall < 98) blöcke[i] = 16;
        else if (zufall < 99) {
            let s = random(100);
            if (s < 30)      blöcke[i] = 5;
            else if (s < 50) blöcke[i] = 6;
            else if (s < 70) blöcke[i] = 7;
            else if (s < 80) blöcke[i] = 8;
            else if (s < 90) blöcke[i] = 9;
            else             blöcke[i] = 10;
        } else blöcke[i] = 4;
    }
    for (let i = 0; i < 171; i++) {
        if (blöcke[i] === 4 && i + 19 < 171) blöcke[i + 19] = 3;
    }
    chunks[chunkId] = blöcke;

    if (random(100) < 20) {
        let teile = chunkId.split('_');
        let cx = int(teile[1]), cy = int(teile[2]);
        let zb = floor(random(171));
        let col = cx * 19 + (zb % 19);
        let row = cy * 9 + floor(zb / 19);
        if (random(100) < 20) {
            let leitschaf = { 
                x:col*100+50, 
                y:row*100+50, 
                richtungX:random([-1,0,1]), 
                richtungY:random([-1,0,1]), 
                timer:0, 
                schritt:0, 
                istLeitschaf:true,
                hunger: schafHunger,     
                maxHunger: schafHunger    
            };
            schafe.push(leitschaf);
            for (let i = 0; i < 5; i++) {
                schafe.push({ 
                    x:col*100+50+random(-100,100), 
                    y:row*100+50+random(-100,100), 
                    richtungX:0, 
                    richtungY:0, 
                    timer:0, 
                    schritt:0, 
                    istLeitschaf:false, 
                    folgtSchaf:leitschaf,
                    hunger: schafHunger,     
                    maxHunger: schafHunger    
                });
            }
        } else {
            schafe.push({ 
                x:col*100+50, 
                y:row*100+50, 
                richtungX:random([-1,0,1]), 
                richtungY:random([-1,0,1]), 
                timer:0, 
                schritt:0, 
                istLeitschaf:true,
                hunger: schafHunger,         
                maxHunger: schafHunger       
            });
        }
    }
    return blöcke;
}

function blockAnPosition(weltX, weltY) {
    let blockCol = floor(weltX / 100), blockRow = floor(weltY / 100);
    let chunkX = floor(blockCol / 19), chunkY = floor(blockRow / 9);
    let lokalCol = blockCol - chunkX * 19, lokalRow = blockRow - chunkY * 9;
    let blockIndex = lokalRow * 19 + lokalCol;
    let chunkId = 'chunk_' + chunkX + '_' + chunkY;
    if (!chunks[chunkId]) return 1;
    if (blockIndex < 0 || blockIndex >= 171) return 1;
    return chunks[chunkId][blockIndex];
}

function istZaun(neuesKameraX, neuesKameraY) {
    const typ = blockAnPosition(width/2 - neuesKameraX, height/2 - neuesKameraY);
    return typ === 15 || typ === 3 || typ === 4;
}

function zeichneChunk(chunkId, offsetX, offsetY) {
    let blöcke = generiereChunk(chunkId);
    let px = offsetX, py = offsetY;
    imageMode(CORNER);
    for (let i = 0; i < blöcke.length; i++) {
        let typ = blockTypen[blöcke[i]];
        if (typ === 'gras')             image(gras,             px, py, 101, 101);
        if (typ === 'wildkarotenblock') image(wildkarotenblock, px, py, 101, 101);
        if (typ === 'blume')            image(blume,            px, py, 101, 101);
        if (typ === 'baum_unten')       image(baumUnten,        px, py, 101, 101);
        if (typ === 'baum_oben')        image(baumOben,         px, py, 101, 101);
        if (typ === 'zaunblock')        image(zaunblock,        px, py, 101, 101);
        if (typ === 'steinblock')        image(steinblock,        px, py, 101, 101);
        if (typ === 'acker')            image(acker,            px, py, 101, 101);
        if (typ === 'karots1')          image(karots1,          px, py, 101, 101);
        if (typ === 'karots2')          image(karots2,          px, py, 101, 101);
        if (typ === 'himbeer1') { image(gras, px, py, 101, 101); image(himbeer1Img, px, py, 101, 101); }
        if (typ === 'himbeer2') { image(gras, px, py, 101, 101); image(himbeer2Img, px, py, 101, 101); }
        if (typ === 'himbeer3') { image(gras, px, py, 101, 101); image(himbeer3Img, px, py, 101, 101); }
        if (typ === 'himbeer4') { image(gras, px, py, 101, 101); image(himbeer4Img, px, py, 101, 101); }
        if (typ === 'himbeer5') { image(gras, px, py, 101, 101); image(himbeer5Img, px, py, 101, 101); }
        if (typ === 'himbeer6') { image(gras, px, py, 101, 101); image(himbeer6Img, px, py, 101, 101); }
        px += 100;
        if (i % 19 === 18) { py += 100; px = offsetX; }
    }
}

function welcherChunk() {
    return { cx: floor(-kameraX / (19*100)), cy: floor(-kameraY / (9*100)) };
}

function getZielBlock() {
    let sx = width/2 - kameraX, sy = height/2 - kameraY;
    let zx = sx, zy = sy;
    if (richtung === 'oben')   zy -= 100;
    if (richtung === 'unten')  zy += 100;
    if (richtung === 'links')  zx -= 100;
    if (richtung === 'rechts') zx += 100;
    let blockCol = floor(zx/100), blockRow = floor(zy/100);
    let chunkX = floor(blockCol/19), chunkY = floor(blockRow/9);
    let lokalCol = blockCol - chunkX*19, lokalRow = blockRow - chunkY*9;
    return { chunkId:'chunk_'+chunkX+'_'+chunkY, blockIndex:lokalRow*19+lokalCol, zielX:blockCol*100, zielY:blockRow*100 };
}

function getBlockUnterSpieler() {
    let sx = width/2 - kameraX, sy = height/2 - kameraY;
    let blockCol = floor(sx/100), blockRow = floor(sy/100);
    let chunkX = floor(blockCol/19), chunkY = floor(blockRow/9);
    let lokalCol = blockCol - chunkX*19, lokalRow = blockRow - chunkY*9;
    return { chunkId:'chunk_'+chunkX+'_'+chunkY, blockIndex:lokalRow*19+lokalCol };
}

function getBlockHinterSpieler() {
    let sx = width/2 - kameraX, sy = height/2 - kameraY;
    let zx = sx, zy = sy;
    if (richtung === 'oben')   zy += 100;
    if (richtung === 'unten')  zy -= 100;
    if (richtung === 'links')  zx += 100;
    if (richtung === 'rechts') zx -= 100;
    let blockCol = floor(zx/100), blockRow = floor(zy/100);
    let chunkX = floor(blockCol/19), chunkY = floor(blockRow/9);
    let lokalCol = blockCol - chunkX*19, lokalRow = blockRow - chunkY*9;
    return { chunkId:'chunk_'+chunkX+'_'+chunkY, blockIndex:lokalRow*19+lokalCol };
}

function zeigeBaumHinweis(text, dauer = 900) {
    baumHinweis = text;
    baumHinweisBis = millis() + dauer;
}

function clearBaum(chunkId, blockIndex) {
    if (!chunks[chunkId]) return false;

    let oben = null;
    let unten = null;

    if (chunks[chunkId][blockIndex] === 4 && blockIndex + 19 < 171 && chunks[chunkId][blockIndex + 19] === 3) {
        oben = blockIndex;
        unten = blockIndex + 19;
    } else if (chunks[chunkId][blockIndex] === 3 && blockIndex - 19 >= 0 && chunks[chunkId][blockIndex - 19] === 4) {
        oben = blockIndex - 19;
        unten = blockIndex;
    }

    if (oben === null || unten === null) return false;

    baumTragend = { chunkId, oben, unten };
    chunks[chunkId][oben] = 1;
    chunks[chunkId][unten] = 1;
    return true;
}

function setBaum(chunkId, blockIndex) {
    if (!chunks[chunkId]) return false;

    const obenIndex = blockIndex - 19;
    const untenIndex = blockIndex;

    if (obenIndex < 0 || untenIndex < 0 || untenIndex + 19 >= 171) return false;

    const spieler = getBlockUnterSpieler();
    if (chunkId === spieler.chunkId && (obenIndex === spieler.blockIndex || untenIndex === spieler.blockIndex)) return false;

    const oben = chunks[chunkId][obenIndex];
    const unten = chunks[chunkId][untenIndex];
    const darfOben = (oben === 1 || oben === 2 || oben === 11 || oben === 12 || oben === 13 || oben === 14);
    const darfUnten = (unten === 1 || unten === 2 || unten === 11 || unten === 12 || unten === 13 || unten === 14);

    if (!darfOben || !darfUnten) return false;

    chunks[chunkId][obenIndex] = 4;
    chunks[chunkId][untenIndex] = 3;
    baumTragend = null;
    return true;
}

function drawZiehtBaum() {
    let x = width/2, y = height/2;
    if (richtung === 'oben')   y += 110;
    if (richtung === 'unten')  y -= 110;
    if (richtung === 'links')  x += 110;
    if (richtung === 'rechts') x -= 110;
    imageMode(CENTER);
    image(baumOben, x, y - 50, 100, 100);
    image(baumUnten, x, y + 50, 100, 100);
}


function updateSchafe() {
    for (let s of schafe) {
        if (s.letzteHungerZeit === undefined) {
            s.letzteHungerZeit = millis();
        }

        if (millis() - s.timer > 2000) {
            s.richtungX = random([-1,0,1]);
            s.richtungY = random([-1,0,1]);
            s.timer = millis();
        }
        let nx = s.x + s.richtungX * 1.5;
        let ny = s.y + s.richtungY * 1.5;
        if (blockAnPosition(nx, ny) !== 15) { s.x = nx; s.y = ny; }
        else { s.richtungX = random([-1,0,1]); s.richtungY = random([-1,0,1]); }
        s.schritt += 0.1;

        if (millis() - s.letzteHungerZeit >= 60000) {
            s.hunger = max(0, s.hunger - 40);
            s.letzteHungerZeit = millis();
        }

        if (millis() - s.timer > 3000) {
            let blockUnterSchaf = blockAnPosition(s.x, s.y);
            if ((blockUnterSchaf === 12 || blockUnterSchaf === 11 || blockUnterSchaf === 13 || blockUnterSchaf === 14) && random(100) < 90) {
                s.hunger = min(s.maxHunger, s.hunger + 50);
            }
        }
    }
}

function drawSchafe() {
    push();
    translate(kameraX, kameraY);
    imageMode(CENTER);
    for (let s of schafe) {
        let wipp = sin(s.schritt) * 3;
        image(schafBack,  s.x,      s.y + wipp, 60, 60);
        image(schafFront, s.x - 60, s.y + wipp, 60, 60);
        let spielerWeltX = width/2 - kameraX;
        let spielerWeltY = height/2 - kameraY;
        if (dist(spielerWeltX, spielerWeltY, s.x, s.y) < 100) {
            if (keyCode === 116 && keyIsDown(ALT)) {
                fill(0); rect(s.x - 20, s.y - 45, 40, 5);
                fill(0, 200, 0); rect(s.x - 20, s.y - 45, 40 * (s.hunger/s.maxHunger), 5);
            }
        }
    }
    pop();
}

function updateNpc() {
    if (millis() - npcTimer > 2000) {
        npcRichtungX = random([-1,0,1]);
        npcRichtungY = random([-1,0,1]);
        npcTimer = millis();
    }
    npcX += npcRichtungX * 2;
    npcY += npcRichtungY * 2;
}

function updateHaendler() {
    if (haendlerChat) return;
    if (millis() - haendler.timer > 2500) {
        let opt = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},{x:0,y:0},{x:0,y:0}];
        let r = random(opt);
        haendler.richtungX = r.x;
        haendler.richtungY = r.y;
        haendler.timer = millis();
    }
    haendler.x += haendler.richtungX * 1.2;
    haendler.y += haendler.richtungY * 1.2;
    haendler.schritt += 0.08;
}

function drawHaendler() {
    push();
    translate(kameraX, kameraY);
    imageMode(CENTER);
    let wipp = sin(haendler.schritt) * 3;
    image(haendlerUp,   haendler.x, haendler.y - 30 + wipp, 40, 40);
    image(haendlerDown, haendler.x, haendler.y + 10 + wipp, 40, 40);

    let sx = width/2 - kameraX, sy = height/2 - kameraY;
    if (dist(sx, sy, haendler.x, haendler.y) < 150 && !haendlerChat) {
        fill(255, 240, 150, 230); noStroke(); rectMode(CENTER);
        rect(haendler.x, haendler.y - 60 + wipp, 90, 22, 5);
        fill(50, 30, 0); textSize(12); textAlign(CENTER);
        text('[E] Handeln', haendler.x, haendler.y - 53 + wipp);
    }
    pop();
}

function drawHaendlerChat() {
    if (!haendlerChat) return;
    rectMode(CORNER); fill(15,10,5,235); noStroke();
    rect(0, height-280, width, 280);
    stroke(180,140,50); strokeWeight(2);
    line(0, height-280, width, height-280); noStroke();
    fill(220,180,60); textSize(15); textAlign(LEFT);
    text('Händler Aldric  –  Tippe & ENTER zum Senden  |  ESC = schließen', 20, height-252);
    stroke(80,60,20); strokeWeight(1);
    line(10, height-242, width-10, height-242); noStroke();

    let zeigeVon = max(0, haendlerVerlauf.length - 6);
    for (let i = zeigeVon; i < haendlerVerlauf.length; i++) {
        let e = haendlerVerlauf[i];
        let y = height - 230 + (i - zeigeVon) * 32;
        if (e.von === 'spieler') {
            fill(120,170,255); textSize(14); textAlign(LEFT); text('Du:', 15, y);
            fill(200,220,255); text(e.text, 50, y);
        } else {
            fill(220,170,50); textSize(14); textAlign(LEFT); text('Aldric:', 15, y);
            fill(255,235,180); text(e.text, 75, y);
        }
    }

    fill(30,22,10); stroke(120,90,30); strokeWeight(1);
    rectMode(CORNER); rect(10, height-48, width-130, 38, 5); noStroke();
    fill(220,200,160); textSize(15); textAlign(LEFT);
    text(haendlerInput + (frameCount % 60 < 30 ? '|' : ''), 20, height-23);
    fill(haendlerWartet ? 60 : 140, haendlerWartet ? 60 : 100, 20);
    stroke(180,140,50); strokeWeight(1); rectMode(CORNER);
    rect(width-115, height-48, 105, 38, 5); noStroke();
    fill(255,240,180); textSize(14); textAlign(CENTER);
    text(haendlerWartet ? '...' : 'Senden', width-62, height-23);
    if (haendlerWartet) {
        fill(220,180,60,150+sin(frameCount*0.1)*100);
        textSize(13); textAlign(LEFT); text('Aldric überlegt...', 15, height-58);
    }
}

async function haendlerKIAnfrage(nachricht) {
    haendlerWartet = true;
    try {
        let antwort = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: nachricht })
        });
        let daten = await antwort.json();
        let text = daten.response;

        let dealMatch = text.match(/\[DEAL:gebe:(\w+):(\d+):bekomme:(\w+):(\d+)\]/i);
        if (dealMatch) {
            text = text.replace(dealMatch[0], '').trim();
            letzterDeal = {
                gebe: dealMatch[1].toLowerCase(), gebeAnzahl: int(dealMatch[2]),
                bekomme: dealMatch[3].toLowerCase(), bekommeAnzahl: int(dealMatch[4])
            };
            text += ' Einverstanden? (ja / nein)';
        }
        haendlerVerlauf.push({ von:'haendler', text: text });
    } catch(e) {
        haendlerVerlauf.push({ von:'haendler', text:'Galileo antwortet nicht. Läuft server.py?' });
    }
    haendlerWartet = false;
}

function führeDealAus() {
    if (!letzterDeal) return;
    let d = letzterDeal;
    let hatGenug = inventar.some(s => s && s.typ === d.bekomme && s.anzahl >= d.bekommeAnzahl);
    if (!hatGenug) {
        haendlerVerlauf.push({ von:'haendler', text:'Ihr habt nicht genug ' + d.bekomme + '!' });
        letzterDeal = null; return;
    }
    for (let i = 0; i < inventar.length; i++) {
        if (inventar[i] && inventar[i].typ === d.bekomme) {
            inventar[i].anzahl -= d.bekommeAnzahl;
            if (inventar[i].anzahl <= 0) inventar[i] = null;
            break;
        }
    }
    addInventar(d.gebe, d.gebeAnzahl);
    haendlerVerlauf.push({ von:'haendler', text:'Handel abgeschlossen! Kommt bald wieder!' });
    letzterDeal = null;
}

function addInventar(typ, anzahl) {
    for (let i = 0; i < inventar.length; i++) {
        if (inventar[i] && inventar[i].typ === typ) { inventar[i].anzahl += anzahl; return; }
    }
    for (let i = 0; i < inventar.length; i++) {
        if (!inventar[i]) { inventar[i] = { typ, anzahl }; return; }
    }
}

function drawInventar() {
    let slotGröße = 60, pad = 8;
    let startX = width/2 - (8*(slotGröße+pad))/2;
    let startY = haendlerChat ? height-280-slotGröße-pad*2 : height-slotGröße-pad*2;
    rectMode(CORNER);
    for (let i = 0; i < 8; i++) {
        let sx = startX + i*(slotGröße+pad), sy = startY;
        fill(i === aktiverSlot ? 150 : 50, 200); noStroke();
        rect(sx, sy, slotGröße, slotGröße, 6);
        if (inventar[i]) {
            imageMode(CORNER);
            if (inventar[i].typ === 'axt')              image(axtImg,          sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'spitzhacke')       image(spitzhacke,      sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'messer')           image(messerImg,       sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'steininventar')    image(steininventar,       sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'hacke')            image(hacke,           sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'himbeere')         image(himbeereSammeln, sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'rohschaffleisch')  image(rohschaffleischImg, sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'gold')             image(goldImg,         sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'feuerstein')       image(feuersteinImg,   sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'bretter')          image(bretter,         sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'karote')           image(karote,          sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'inventarholz')     image(inventarholz,    sx+5, sy+5, slotGröße-10, slotGröße-10);
            if (inventar[i].typ === 'zauninventar')     image(zauninventarImg, sx+5, sy+5, slotGröße-10, slotGröße-10);
            fill(255); textSize(14); textAlign(RIGHT);
            text(inventar[i].anzahl, sx+slotGröße-5, sy+slotGröße-5);
        }
    }
}

function drawFadenkreuz() {
    let { zielX, zielY } = getZielBlock();
    let screenX = zielX + kameraX + 50, screenY = zielY + kameraY + 50;
    stroke(255); strokeWeight(2);
    line(screenX-10, screenY, screenX+10, screenY);
    line(screenX, screenY-10, screenX, screenY+10);
    noStroke();
}

function calkulatehunger() {
    if (millis() - letzteZeit >= 60000) { hunger = max(0, hunger-20); letzteZeit = millis(); }
}
function drawhunger() {
    rectMode(CORNER); noStroke();
    fill(0); rect(700, 954, 200, 30);
    fill(0,0,255); rect(700, 954, hunger, 30);
}
function calkulatehealth() {
    if (hunger <= 0 && millis() - letzteZeitHealth >= 5000) { health = max(0, health-20); letzteZeitHealth = millis(); }
}
function drawhealth() {
    rectMode(CORNER); noStroke();
    fill(0); rect(1100, 954, 200, 30);
    fill(255,0,0); rect(1100, 954, health, 30);
}

function drawCrafting() {
    if (!craftingOffen) return;
    rectMode(CENTER); fill(50,220); noStroke();
    rect(width/2, height/2, 600, 400, 10);
    fill(255); textSize(22); textAlign(CENTER);
    text('Crafting', width/2, height/2-170);
    if (ausgewähltesRezept === null) {
        for (let i = 0; i < rezepte.length; i++) {
            let rx = width/2-200+i*100, ry = height/2;
            fill(80,200); rectMode(CENTER); rect(rx, ry, 70, 70, 6);
            if (rezepte[i].bild) { imageMode(CENTER); image(rezepte[i].bild, rx, ry, 55, 55); }
            fill(255); textSize(12); text(rezepte[i].name, rx, ry+45);
        }
        fill(180); textSize(14); text('Klicke ein Rezept an', width/2, height/2+150);
    } else {
        let r = rezepte[ausgewähltesRezept];
        fill(255); textSize(18); text(r.name, width/2, height/2-100);
        for (let i = 0; i < r.zutaten.length; i++) {
            let z = r.zutaten[i];
            let zx = width/2-100+i*100, zy = height/2-30;
            fill(80,200); rectMode(CENTER); rect(zx, zy, 60, 60, 6);
            let zb = getInventarBild(z.typ);
            if (zb) { imageMode(CENTER); image(zb, zx, zy, 45, 45); }
            fill(255); textSize(13); text('x'+z.anzahl, zx, zy+38);
        }
        fill(255); textSize(35); text('→', width/2, height/2+50);
        if (r.bild) { imageMode(CENTER); image(r.bild, width/2+80, height/2+40, 55, 55); }
        fill(150,80,80); rectMode(CENTER); rect(width/2-150, height/2+130, 120, 35, 6);
        fill(255); textSize(14); text('← Zurück', width/2-150, height/2+137);
        fill(80,150,80); rect(width/2+100, height/2+130, 150, 35, 6);
        fill(255); text('Herstellen (C)', width/2+100, height/2+137);
    }
}

function getInventarBild(typ) {
    if (typ === 'bretter')      return bretter;
    if (typ === 'inventarholz') return inventarholz;
    if (typ === 'karote')       return karote;
    if (typ === 'steininventar')return steininventar;
    if (typ === 'axt')          return axtImg;
    if (typ === 'spitzhacke')   return spitzhacke;
    if (typ === 'hacke')        return hacke;
    if (typ === 'messer')       return messerImg;
    return null;
}

function keyPressed() {
    if (haendlerChat) {
        if (keyCode === ESCAPE) { haendlerChat = false; haendlerInput = ''; letzterDeal = null; return; }
        if (keyCode === ENTER && haendlerInput.trim() !== '' && !haendlerWartet) {
            let msg = haendlerInput.trim();
            let msgLow = msg.toLowerCase();
            haendlerVerlauf.push({ von:'spieler', text:msg });
            haendlerInput = '';
            if ((msgLow === 'ja' || msgLow === 'ok' || msgLow === 'einverstanden') && letzterDeal) { führeDealAus(); return; }
            if ((msgLow === 'nein' || msgLow === 'nö') && letzterDeal) {
                letzterDeal = null;
                haendlerVerlauf.push({ von:'haendler', text:'Schade! Macht mir ein anderes Angebot.' });
                return;
            }
            haendlerKIAnfrage(msg);
            return;
        }
        if (keyCode === BACKSPACE) { haendlerInput = haendlerInput.slice(0,-1); return; }
        if (key && key.length === 1) { haendlerInput += key; return; }
        return;
    }

    if (key >= '1' && key <= '8') aktiverSlot = int(key) - 1;
    if (key === 'i' || key === 'I') { craftingOffen = !craftingOffen; ausgewähltesRezept = null; }

    if (key === 'p' || key === 'P') {
        if (!baumZiehAktiv) {
            let ziel = getZielBlock();
            if (clearBaum(ziel.chunkId, ziel.blockIndex)) {
                baumZiehAktiv = true;
                zeigeBaumHinweis('Baum gehalten – U zum Loslassen');
            }
        }
        return;
    }

    if (key === 'u' || key === 'U') {
        if (baumZiehAktiv) {
            let ziel = getZielBlock();
            if (setBaum(ziel.chunkId, ziel.blockIndex)) {
                baumZiehAktiv = false;
            } else {
                zeigeBaumHinweis('Hier geht der Baum nicht hin');
            }
        }
        return;
    }

    if (key === 'e' || key === 'E') {
        let sx = width/2 - kameraX, sy = height/2 - kameraY;
        if (dist(sx, sy, haendler.x, haendler.y) < 150) {
            haendlerChat = true; craftingOffen = false;
            haendlerVerlauf = [{ von:'haendler', text:'Seid gegrüßt! Was möchtet Ihr handeln?' }];
            return;
        }
        if (inventar[aktiverSlot] && inventar[aktiverSlot].typ === 'zauninventar') {
            let { chunkId, blockIndex } = getZielBlock();
            let b = chunks[chunkId] && chunks[chunkId][blockIndex];
            if (b === 1 || b === 2 || b === 11 || b === 12 || b === 13 || b === 14) {
                chunks[chunkId][blockIndex] = 15;
                inventar[aktiverSlot].anzahl--;
                if (inventar[aktiverSlot].anzahl <= 0) inventar[aktiverSlot] = null;
                return;
            }
        }
        let { chunkId, blockIndex } = getZielBlock();
        if (chunks[chunkId]) {
            let bw = chunks[chunkId][blockIndex];
            let anzahl = himbeerAnzahl[bw];
            if (anzahl) { chunks[chunkId][blockIndex] = 1; addInventar('himbeere', anzahl); return; }
            if (bw === 11) { chunks[chunkId][blockIndex] = 1; addInventar('karote', 1); return; }
            if (bw === 12) {
                let schlüssel = chunkId + '_blockIndex_' + blockIndex;
                if (inventar[aktiverSlot] && inventar[aktiverSlot].typ === 'karote' && !blockPflanzzeit[schlüssel]) {
                    inventar[aktiverSlot].anzahl--;
                    if (inventar[aktiverSlot].anzahl <= 0) inventar[aktiverSlot] = null;
                    blockPflanzzeit[schlüssel] = millis();
                }
                return;
            }
            if (bw === 14) {
                chunks[chunkId][blockIndex] = 12;
                delete blockPflanzzeit[chunkId + '_blockIndex_' + blockIndex];
                addInventar('karote', 4); return;
            }
            if (inventar[aktiverSlot] && hunger < 200) {
                if (inventar[aktiverSlot].typ === 'himbeere') {
                    inventar[aktiverSlot].anzahl--;
                    if (inventar[aktiverSlot].anzahl <= 0) inventar[aktiverSlot] = null;
                    hunger = min(200, hunger+5); if (health < 200) health += 10;
                } else if (inventar[aktiverSlot].typ === 'karote') {
                    inventar[aktiverSlot].anzahl--;
                    if (inventar[aktiverSlot].anzahl <= 0) inventar[aktiverSlot] = null;
                    hunger = min(200, hunger+10); if (health < 200) health += 10;
                }
                 else if (inventar[aktiverSlot].typ === 'rohschaffleisch') {
                    inventar[aktiverSlot].anzahl--;
                    if (inventar[aktiverSlot].anzahl <= 0) inventar[aktiverSlot] = null;
                    hunger = min(200, hunger + 8);
                    if (random(100) < 1) {
                        for (let i = 0; i < 5; i++) {
                            health = max(0, health - 20);
                        }
                    } else {
                        if (health < 200) health += 5;
                    }
                }
            }
        }

        if (key === 'e' || key === 'E') {
            let sx = width/2 - kameraX;
            let sy = height/2 - kameraY;

            if (inventar[aktiverSlot] && inventar[aktiverSlot].typ === 'karote') {
                for (let s of schafe) {
                    if (dist(sx, sy, s.x, s.y) < 80) {
                        inventar[aktiverSlot].anzahl--;
                        if (inventar[aktiverSlot].anzahl <= 0) inventar[aktiverSlot] = null;
                    
                        let maxLimit = s.maxHunger || schafHunger;
                        if (s.hunger === undefined) s.hunger = maxLimit;
                        s.hunger = min(maxLimit, s.hunger + 15);
                        return;
                    }
                }
            }
        }
    }


    if (key === 'q' || key === 'Q') {
        let { chunkId, blockIndex } = getZielBlock();
        if (inventar[aktiverSlot] && inventar[aktiverSlot].typ === 'axt') {
            if (chunks[chunkId] && chunks[chunkId][blockIndex] === 4) {
                chunks[chunkId][blockIndex] = 1;
                if (blockIndex + 19 < 171) chunks[chunkId][blockIndex+19] = 1;
                addInventar('inventarholz', 1);
            }
            if (chunks[chunkId] && chunks[chunkId][blockIndex] === 15) {
                chunks[chunkId][blockIndex] = 1;
                addInventar('zauninventar', 1);
            }
        }
        if (inventar[aktiverSlot] && inventar[aktiverSlot].typ === 'spitzhacke') {
            if (chunks[chunkId] && chunks[chunkId][blockIndex] === 16) {
                chunks[chunkId][blockIndex] = 1;
                addInventar('steininventar', 1);
            }
        }
        if (inventar[aktiverSlot] && inventar[aktiverSlot].typ === 'inventarholz') {
            addInventar('bretter', 4);
            inventar[aktiverSlot].anzahl--;
            if (inventar[aktiverSlot].anzahl <= 0) inventar[aktiverSlot] = null;
        }
        if (inventar[aktiverSlot] && inventar[aktiverSlot].typ === 'hacke') {
            let b = chunks[chunkId] && chunks[chunkId][blockIndex];
            if (b === 1 || b === 2 || b === 11) chunks[chunkId][blockIndex] = 12;
        }
    }

    if (inventar[aktiverSlot] && inventar[aktiverSlot].typ === 'messer') {
        let spielerWeltX = width/2 - kameraX;
        let spielerWeltY = height/2 - kameraY;
        for (let s of schafe) {
            if (dist(spielerWeltX, spielerWeltY, s.x, s.y) < 80) {
                schafe.splice(schafe.indexOf(s), 1);
                addInventar('rohschaffleisch', 2);
                return;
            }
        }
    }
}

function mousePressed() {
    if (!craftingOffen) return;
    if (ausgewähltesRezept === null) {
        for (let i = 0; i < rezepte.length; i++) {
            let rx = width/2-200+i*100, ry = height/2;
            if (dist(mouseX, mouseY, rx, ry) < 40) ausgewähltesRezept = i;
        }
    } else {
        if (dist(mouseX, mouseY, width/2-150, height/2+130) < 60) ausgewähltesRezept = null;
    }
}
const FRANZ_DATEN = [
    {f:"hallo", a:"Guten Tag! Ich bin Franz, der Händler! Was kann ich für Euch tun?"},
    {f:"hi", a:"Ah, ein Kunde! Franz begrüßt Euch herzlich! Was darf es sein?"},
    {f:"guten morgen", a:"Guten Morgen! Franz ist seit fünf Uhr hier. Frische Waren warten!"},
    {f:"guten tag", a:"Guten Tag! Franz, 51 Jahre alt, bester Händler weit und breit!"},
    {f:"guten abend", a:"Guten Abend! Franz macht noch bis Sonnenuntergang auf. Was braucht Ihr?"},
    {f:"wie geht es dir", a:"Prächtig! Der Handel läuft gut. Was darf Franz für Euch tun?"},
    {f:"wer bist du", a:"Ich bin Franz! 51 Jahre, 25 Jahre Händler, der Ehrlichste auf dem Markt!"},
    {f:"wie heißt du", a:"Franz! Händler Franz. Bekannt in der ganzen Region für faire Preise!"},
    {f:"wie alt bist du", a:"51 Jahre! Und noch fit wie ein junger Händler!"},
    {f:"wie lange bist du händler", a:"25 Jahre! Angefangen mit einem kleinen Stand, heute der Größte hier!"},
    {f:"hast du familie", a:"Ja! Frau Maria, zwei Söhne und Tochter Lena. Die Tochter lernt auch Handeln!"},
    {f:"was ist dein hobby", a:"Handeln! Und abends Gewinne nachzählen. Franz nennt das Entspannung!"},
    {f:"was ist dein lebensmotto", a:"Ein fairer Händler schläft gut und lebt lang! Mein Vater hat es mir beigebracht!"},
    {f:"hast du einen hund", a:"Ja! Münze heißt er. 12 Jahre alt und schläft unter dem Tisch. Brav!"},
    {f:"woher kommst du", a:"Aus dem Norden! Als junger Mann hierhergezogen und nie mehr weggegangen!"},
    {f:"bist du ehrlich", a:"Franz hat 25 Jahre ohne Betrugsklage! Das spricht für sich!"},
    {f:"kann ich dir vertrauen", a:"Ja! Franz baut Vertrauen durch faire Deals auf. Probiert es aus!"},
    {f:"du bist ein guter händler", a:"Das ist das größte Kompliment! 25 Jahre für diesen Satz gearbeitet!"},
    {f:"ich mag dich", a:"Das freut Franz! Stammkunden kriegen immer die besten Preise!"},
    {f:"auf wiedersehen", a:"Auf Wiedersehen! Franz freut sich auf Euren nächsten Besuch!"},
    {f:"tschüss", a:"Tschüss! War schön mit Euch. Franz ist morgen wieder hier!"},
    {f:"bis bald", a:"Bis bald! Franz hält frische Waren bereit!"},
    {f:"danke", a:"Danke Euch! Franz sagt: Ein zufriedener Kunde ist besser als zehn neue!"},
    {f:"danke schön", a:"Gern geschehen! Kommt jederzeit wieder!"},
    {f:"ich empfehle dich weiter", a:"Das macht Franz glücklich! Beim nächsten Besuch gibt es Extra-Rabatt!"},
    {f:"ich schaue mich nur um", a:"Schaut ruhig! Franz ist hier wenn Ihr Fragen habt. Kein Druck!"},
 
    {f:"ich möchte himbeeren kaufen", a:"Himbeeren! Franz hat welche. Was bietet Ihr dafür? Holz, Wolle, Gold oder Feuerstein?"},
    {f:"ich will himbeeren", a:"Himbeeren kaufen! Was habt Ihr anzubieten? Franz hört Euer Angebot!"},
    {f:"ich brauche himbeeren", a:"Himbeeren! Franz hat sie. Was bietet Ihr im Tausch? Gold, Holz oder Wolle?"},
    {f:"himbeeren kaufen", a:"Himbeeren! Sehr gut. Was bietet Ihr Franz dafür an?"},
    {f:"gib mir himbeeren", a:"Himbeeren! Gerne. Was habt Ihr zum Tauschen? Franz ist fair!"},
    {f:"ich möchte holz kaufen", a:"Holz! Franz hat genug. Was bietet Ihr dafür? Gold, Feuerstein oder Wolle?"},
    {f:"ich will holz", a:"Holz kaufen! Was habt Ihr anzubieten? Franz hört zu!"},
    {f:"ich brauche holz", a:"Holz! Franz hat es. Was gibt es im Tausch? Sagt Franz Euer Angebot!"},
    {f:"ich möchte wolle kaufen", a:"Wolle! Feine Ware. Was bietet Ihr Franz dafür? Gold oder Feuerstein?"},
    {f:"ich will wolle", a:"Wolle kaufen! Was habt Ihr anzubieten? Franz macht einen fairen Preis!"},
    {f:"ich brauche wolle", a:"Wolle! Franz hat welche. Was bietet Ihr im Tausch?"},
    {f:"ich möchte fleisch kaufen", a:"Fleisch! Frisch und gut. Was bietet Ihr Franz dafür?"},
    {f:"ich will fleisch", a:"Fleisch kaufen! Was habt Ihr anzubieten? Franz hört Euer Angebot!"},
    {f:"ich brauche fleisch", a:"Fleisch! Franz hat es. Was gibt es dafür? Gold, Holz oder Wolle?"},
    {f:"ich möchte feuerstein kaufen", a:"Feuerstein! Sehr nützlich. Was bietet Ihr Franz dafür an?"},
    {f:"ich will feuerstein", a:"Feuerstein kaufen! Was habt Ihr zum Tausch? Franz ist gespannt!"},
    {f:"ich brauche feuerstein", a:"Feuerstein! Franz hat welchen. Was bietet Ihr im Tausch?"},
    {f:"ich möchte gold kaufen", a:"Gold! Das Edelste! Was bietet Ihr Franz dafür? Holz, Wolle oder Feuerstein?"},
    {f:"ich will gold", a:"Gold kaufen! Was habt Ihr anzubieten? Franz hört Euer Angebot!"},
    {f:"ich brauche gold", a:"Gold! Franz hat welches. Was bietet Ihr dafür? Sagt Euer Angebot!"},
    {f:"ich möchte eine axt kaufen", a:"Eine Axt! Gutes Werkzeug. Was bietet Ihr Franz dafür? 3 Gold oder 60 Holz wären fair!"},
    {f:"ich will eine axt", a:"Axt kaufen! Was habt Ihr anzubieten? Franz macht einen fairen Preis!"},
    {f:"ich brauche eine axt", a:"Eine Axt! Franz hat welche. Was bietet Ihr im Tausch? 3 Gold oder 60 Holz!"},
    {f:"eine axt bitte", a:"Eine Axt! Dafür nehme ich 3 Gold oder 60 Holz. Was habt Ihr?"},
    {f:"axt kaufen", a:"Eine Axt von Franz! 3 Gold oder 60 Holz. Was bietet Ihr?"},
    {f:"ich möchte eine hacke kaufen", a:"Eine Hacke! Für den Ackerbau. Was bietet Ihr Franz dafür? 2 Gold oder 40 Holz!"},
    {f:"ich will eine hacke", a:"Hacke kaufen! Was habt Ihr anzubieten? Franz hört Euer Angebot!"},
    {f:"ich brauche eine hacke", a:"Eine Hacke! Franz hat welche. Was bietet Ihr im Tausch?"},
    {f:"eine hacke bitte", a:"Eine Hacke! Dafür nehme ich 2 Gold oder 40 Holz. Was habt Ihr?"},
    {f:"ich möchte bretter kaufen", a:"Bretter! Zum Bauen gut. Was bietet Ihr Franz dafür?"},
    {f:"ich möchte karoten kaufen", a:"Karotten! Was bietet Ihr Franz dafür? Holz, Wolle oder Gold?"},
    {f:"ich will karoten", a:"Karotten kaufen! Was habt Ihr anzubieten? Franz macht einen fairen Preis!"},
    {f:"ich möchte tauschen", a:"Tauschen! Das Lieblingswort von Franz! Was habt Ihr und was wollt Ihr?"},
    {f:"ich will handeln", a:"Handeln! Franz ist bereit! Was habt Ihr, was braucht Ihr?"},
    {f:"was hast du zum verkaufen", a:"Franz hat: Gold, Wolle, Fleisch, Holz, Bretter, Feuerstein, Äxte, Hacken und mehr!"},
 
    {f:"ich biete holz für himbeeren", a:"[DEAL:gebe:himbeere:2:bekomme:holz:20] Für 20 Holz gibt Franz 2 Himbeeren! Einverstanden?"},
    {f:"ich biete gold für himbeeren", a:"[DEAL:gebe:himbeere:2:bekomme:gold:1] Für 1 Gold gibt Franz 2 Himbeeren! Einverstanden?"},
    {f:"ich biete wolle für himbeeren", a:"[DEAL:gebe:himbeere:2:bekomme:wolle:1] Für 1 Wolle gibt Franz 2 Himbeeren! Einverstanden?"},
    {f:"10 holz für himbeeren", a:"[DEAL:gebe:himbeere:1:bekomme:holz:10] 10 Holz für 1 Himbeere! Franz nimmt an! Einverstanden?"},
    {f:"20 holz für himbeeren", a:"[DEAL:gebe:himbeere:2:bekomme:holz:20] 20 Holz für 2 Himbeeren! Fair! Einverstanden?"},
    {f:"1 gold für himbeeren", a:"[DEAL:gebe:himbeere:2:bekomme:gold:1] 1 Gold für 2 Himbeeren! Franz ist einverstanden! Einverstanden?"},
    {f:"ich biete holz für wolle", a:"[DEAL:gebe:wolle:1:bekomme:holz:4] Für 4 Holz gibt Franz 1 Wolle! Einverstanden?"},
    {f:"ich biete gold für wolle", a:"[DEAL:gebe:wolle:4:bekomme:gold:1] Für 1 Gold gibt Franz 4 Wolle! Einverstanden?"},
    {f:"4 wolle für 1 gold", a:"[DEAL:gebe:gold:1:bekomme:wolle:4] 4 Wolle für 1 Gold! Franz sagt fair! Einverstanden?"},
    {f:"ich biete holz für gold", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Für 20 Holz gibt Franz 1 Gold! Einverstanden?"},
    {f:"ich biete 20 holz für gold", a:"[DEAL:gebe:gold:1:bekomme:holz:20] 20 Holz für 1 Gold! Franz ist einverstanden! Einverstanden?"},
    {f:"ich biete 40 holz für gold", a:"[DEAL:gebe:gold:2:bekomme:holz:40] 40 Holz für 2 Gold! Perfekt! Einverstanden?"},
    {f:"ich biete feuerstein für gold", a:"[DEAL:gebe:gold:1:bekomme:feuerstein:8] Für 8 Feuerstein gibt Franz 1 Gold! Einverstanden?"},
    {f:"ich biete 8 feuerstein für gold", a:"[DEAL:gebe:gold:1:bekomme:feuerstein:8] 8 Feuerstein für 1 Gold! Franz ist einverstanden! Einverstanden?"},
    {f:"ich biete wolle für gold", a:"[DEAL:gebe:gold:1:bekomme:wolle:4] Für 4 Wolle gibt Franz 1 Gold! Einverstanden?"},
    {f:"ich biete fleisch für gold", a:"[DEAL:gebe:gold:1:bekomme:fleisch:4] Für 4 Fleisch gibt Franz 1 Gold! Einverstanden?"},
    {f:"ich biete holz für eine axt", a:"[DEAL:gebe:axt:1:bekomme:holz:60] 60 Holz für 1 Axt! Franz ist zufrieden! Einverstanden?"},
    {f:"ich biete 60 holz für eine axt", a:"[DEAL:gebe:axt:1:bekomme:holz:60] 60 Holz für 1 Axt! Exakt fair! Einverstanden?"},
    {f:"ich biete 3 gold für eine axt", a:"[DEAL:gebe:axt:1:bekomme:gold:3] 3 Gold für 1 Axt! Franz ist einverstanden! Einverstanden?"},
    {f:"ich biete gold für eine axt", a:"[DEAL:gebe:axt:1:bekomme:gold:3] Für 3 Gold gibt Franz eine Axt! Einverstanden?"},
    {f:"ich biete holz für eine hacke", a:"[DEAL:gebe:hacke:1:bekomme:holz:40] 40 Holz für 1 Hacke! Franz ist zufrieden! Einverstanden?"},
    {f:"ich biete 40 holz für eine hacke", a:"[DEAL:gebe:hacke:1:bekomme:holz:40] 40 Holz für 1 Hacke! Fair! Einverstanden?"},
    {f:"ich biete 2 gold für eine hacke", a:"[DEAL:gebe:hacke:1:bekomme:gold:2] 2 Gold für 1 Hacke! Franz ist einverstanden! Einverstanden?"},
    {f:"ich biete gold für eine hacke", a:"[DEAL:gebe:hacke:1:bekomme:gold:2] Für 2 Gold gibt Franz eine Hacke! Einverstanden?"},
    {f:"ich biete holz für feuerstein", a:"[DEAL:gebe:feuerstein:3:bekomme:holz:20] Für 20 Holz gibt Franz 3 Feuerstein! Einverstanden?"},
    {f:"ich biete wolle für feuerstein", a:"[DEAL:gebe:feuerstein:2:bekomme:wolle:1] Für 1 Wolle gibt Franz 2 Feuerstein! Einverstanden?"},
    {f:"ich biete holz für bretter", a:"[DEAL:gebe:bretter:1:bekomme:holz:1] Holz gegen Bretter 1 zu 1! Einverstanden?"},
    {f:"ich biete gold für bretter", a:"[DEAL:gebe:bretter:15:bekomme:gold:1] Für 1 Gold gibt Franz 15 Bretter! Einverstanden?"},
    {f:"ich biete gold für fleisch", a:"[DEAL:gebe:fleisch:4:bekomme:gold:1] Für 1 Gold gibt Franz 4 Fleisch! Einverstanden?"},
    {f:"ich biete gold für karoten", a:"[DEAL:gebe:karote:2:bekomme:gold:1] Für 1 Gold gibt Franz 2 Karotten! Einverstanden?"},
    {f:"20 holz für 1 gold", a:"[DEAL:gebe:gold:1:bekomme:holz:20] 20 Holz für 1 Gold! Franz ist einverstanden! Einverstanden?"},
    {f:"60 holz für axt", a:"[DEAL:gebe:axt:1:bekomme:holz:60] 60 Holz für eine Axt! Franz stimmt zu! Einverstanden?"},
    {f:"3 gold für axt", a:"[DEAL:gebe:axt:1:bekomme:gold:3] 3 Gold für eine Axt! Franz ist einverstanden! Einverstanden?"},
    {f:"2 gold für hacke", a:"[DEAL:gebe:hacke:1:bekomme:gold:2] 2 Gold für eine Hacke! Franz stimmt zu! Einverstanden?"},
    {f:"40 holz für hacke", a:"[DEAL:gebe:hacke:1:bekomme:holz:40] 40 Holz für eine Hacke! Franz ist einverstanden! Einverstanden?"},
    {f:"ich habe holz", a:"Holz! Franz nimmt 20 Holz für 1 Gold. Wie viel habt Ihr?"},
    {f:"ich habe wolle", a:"Wolle! Franz nimmt 4 Wolle für 1 Gold. Wie viel habt Ihr?"},
    {f:"ich habe gold", a:"Gold! Was wollt Ihr dafür? Wolle, Fleisch, Holz, Feuerstein oder eine Axt?"},
    {f:"ich habe feuerstein", a:"Feuerstein! Franz nimmt 8 Stück für 1 Gold. Wie viel habt Ihr?"},
    {f:"ich habe fleisch", a:"Fleisch! Franz nimmt 4 Stück für 1 Gold. Wie viel habt Ihr?"},
    {f:"ich habe himbeeren", a:"Himbeeren! Franz gibt dafür Gold oder Holz. Was wollt Ihr im Tausch?"},
    {f:"ich habe karoten", a:"Karotten! Franz nimmt 2 Stück für 1 Gold. Wie viel habt Ihr?"},
    {f:"ich habe bretter", a:"Bretter! Franz nimmt 15 Stück für 1 Gold. Wie viel habt Ihr?"},
    {f:"ich habe ein schaf", a:"[DEAL:gebe:gold:3:bekomme:schafe:1] Ein Schaf! Franz zahlt 3 Gold dafür. Einverstanden?"},
    {f:"ich habe eine kuh", a:"[DEAL:gebe:gold:3:bekomme:kühe:1] Eine Kuh! Franz zahlt 3 Gold dafür. Einverstanden?"},
    {f:"ich habe eine axt", a:"[DEAL:gebe:gold:3:bekomme:axt:1] Eine Axt! Franz kauft sie für 3 Gold. Einverstanden?"},
    {f:"ich habe eine hacke", a:"[DEAL:gebe:gold:2:bekomme:hacke:1] Eine Hacke! Franz kauft sie für 2 Gold. Einverstanden?"},
    {f:"ich verkaufe eine axt", a:"[DEAL:gebe:gold:3:bekomme:axt:1] Franz kauft Eure Axt für 3 Gold! Einverstanden?"},
    {f:"ich verkaufe eine hacke", a:"[DEAL:gebe:gold:2:bekomme:hacke:1] Franz kauft Eure Hacke für 2 Gold! Einverstanden?"},
    {f:"was bekomme ich für meine axt", a:"[DEAL:gebe:gold:3:bekomme:axt:1] Für eine Axt zahlt Franz 3 Gold! Einverstanden?"},
    {f:"was bekomme ich für meine hacke", a:"[DEAL:gebe:gold:2:bekomme:hacke:1] Für eine Hacke zahlt Franz 2 Gold! Einverstanden?"},
    {f:"was bekomme ich für 20 holz", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Für 20 Holz gibt Franz 1 Gold! Einverstanden?"},
    {f:"was bekomme ich für 4 wolle", a:"[DEAL:gebe:gold:1:bekomme:wolle:4] Für 4 Wolle gibt Franz 1 Gold! Einverstanden?"},
    {f:"was bekomme ich für 8 feuerstein", a:"[DEAL:gebe:gold:1:bekomme:feuerstein:8] Für 8 Feuerstein gibt Franz 1 Gold! Einverstanden?"},
    {f:"was bekomme ich für 1 gold", a:"Für 1 Gold: 20 Holz, 4 Wolle, 8 Feuerstein, 4 Fleisch oder 2 Himbeeren. Was wollt Ihr?"},
    {f:"was kostet eine axt", a:"Eine Axt kostet bei Franz 3 Gold oder 60 Holz! Was habt Ihr anzubieten?"},
    {f:"was kostet eine hacke", a:"Eine Hacke kostet bei Franz 2 Gold oder 40 Holz! Was habt Ihr anzubieten?"},
    {f:"was kostet gold", a:"1 Gold bekommt Ihr bei Franz für 20 Holz, 4 Wolle oder 8 Feuerstein!"},
    {f:"was kostet wolle", a:"4 Wolle für 1 Gold oder gleichwertiges. Was habt Ihr?"},
    {f:"was kosten himbeeren", a:"2 Himbeeren für 1 Gold oder 20 Holz bei Franz. Was bietet Ihr?"},
 
    {f:"geht da noch was beim preis", a:"Beim Preis noch was? Franz schaut... Für nette Kunden 10% Rabatt! Was wollt Ihr?"},
    {f:"kannst du den preis senken", a:"Preis senken! Franz macht das für Stammkunden. 10% runter. Was soll es sein?"},
    {f:"ist da noch was drin", a:"Noch was drin? Franz schaut in seine Kasse... 5% Rabatt für Euch! Einverstanden?"},
    {f:"geht noch günstiger", a:"Günstiger! Franz denkt nach... Für Euch 10% runter. Das ist fair!"},
    {f:"ich will einen besseren preis", a:"Besserer Preis! Franz macht 10% Rabatt für sympathische Kunden. Was genau wollt Ihr?"},
    {f:"das ist zu teuer", a:"Zu teuer? Franz rechnet fair! Aber für Euch 10% Rabatt. Was wollt Ihr kaufen?"},
    {f:"kannst du billiger machen", a:"Billiger! Franz macht das. 10% Rabatt für nette Kunden. Was soll günstiger sein?"},
    {f:"mach es günstiger", a:"Günstiger! Franz gibt 10% Rabatt. Was wollt Ihr kaufen?"},
    {f:"ich habe nicht genug gold", a:"Nicht genug Gold! Habt Ihr Holz, Wolle oder Feuerstein? Franz nimmt auch das!"},
    {f:"kannst du mir entgegenkommen", a:"Entgegenkommen! Franz kommt immer entgegen. 10% Rabatt für Euch!"},
    {f:"mach mir ein besseres angebot", a:"Besseres Angebot! Franz macht 10% günstiger für Euch. Was wollt Ihr?"},
    {f:"ich biete weniger", a:"Weniger bieten! Sagt Franz wie viel Ihr habt. Er schaut was möglich ist!"},
    {f:"50 holz für eine axt", a:"50 Holz für eine Axt? Franz braucht 60! Noch 10 Holz drauflegen dann Deal!"},
    {f:"2 gold für eine axt", a:"2 Gold für eine Axt? Franz braucht 3 Gold! Noch 1 Gold drauflegen!"},
    {f:"1 gold für eine axt", a:"1 Gold für eine Axt?! Franz lacht... Eine Axt ist 3 Gold wert! Mindestens!"},
    {f:"1 gold für eine hacke", a:"1 Gold für eine Hacke? Franz braucht 2 Gold! Noch 1 drauflegen!"},
    {f:"3 wolle für gold", a:"[DEAL:gebe:gold:1:bekomme:wolle:3] 3 Wolle für 1 Gold? Fast! Aber Franz ist heute großzügig. Deal!"},
    {f:"15 holz für gold", a:"15 Holz für 1 Gold? Franz braucht 20! Noch 5 drauflegen!"},
    {f:"ich gehe sonst woanders hin", a:"Woanders?! Franz ist der fairste Händler! Aber gut, 15% Rabatt damit Ihr bleibt!"},
    {f:"bei anderen ist es günstiger", a:"Günstiger?! Franz bezweifelt das. Aber 10% Rabatt damit Ihr Euch selbst überzeugt!"},
    {f:"was ist dein bestes angebot", a:"Bestes Angebot heute: Axt für 50 Holz statt 60! Nur heute bei Franz!"},
    {f:"hast du sonderangebote", a:"Heute: Feuerstein 10% günstiger! 9 Feuerstein für 1 Gold statt 8!"},
    {f:"ich bin stammkunde", a:"Stammkunde! Franz gibt 10% Rabatt immer. Was darf es sein?"},
    {f:"ich kaufe viel", a:"Großkäufer! Ab 5 Gold Warenwert gibt Franz 15% Rabatt! Was soll es sein?"},
 
    {f:"einverstanden", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Einverstanden! Franz macht den Deal fertig!"},
    {f:"ja", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Sehr gut! Franz ist zufrieden! Handel abgeschlossen!"},
    {f:"ok", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Ok! Franz macht es fertig! Handel abgeschlossen!"},
    {f:"deal", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Deal! Franz liebt dieses Wort! Fertig!"},
    {f:"abgemacht", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Abgemacht! Franz gibt die Hand! Fertig!"},
    {f:"ich nehme es", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Genommen! Franz ist glücklich! Fertig!"},
    {f:"gut", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Gut! Franz macht den Deal! Fertig!"},
    {f:"in ordnung", a:"[DEAL:gebe:gold:1:bekomme:holz:20] In Ordnung! Handel abgeschlossen bei Franz!"},
    {f:"das passt", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Passt! Franz macht es fertig! Sehr gut!"},
    {f:"perfekt", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Perfekt! Franz findet das auch! Handel fertig!"},
    {f:"wir sind uns einig", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Einig! Franz freut sich! Handel abgeschlossen!"},
    {f:"ja bitte", a:"[DEAL:gebe:gold:1:bekomme:holz:20] Ja bitte! Franz macht den Deal sofort!"},
    {f:"nein", a:"Nein! Schade. Franz versteht. Macht ein Gegenangebot wenn Ihr mögt!"},
    {f:"nö", a:"Nö! Kein Drama bei Franz. Vielleicht beim nächsten Mal!"},
    {f:"ich passe", a:"Passt! Franz versteht. Kommt wieder wenn Ihr bereit seid!"},
    {f:"lieber nicht", a:"Schade! Franz ist trotzdem froh Euch gesehen zu haben!"},
    {f:"ich lehne ab", a:"Abgelehnt! Franz macht kein Drama. Gegenangebot ist willkommen!"},
    {f:"ich überlege noch", a:"Kein Druck! Franz ist geduldig. Nehmt Euch Zeit!"},
    {f:"vielleicht später", a:"Franz ist bis Sonnenuntergang hier! Kommt wann Ihr bereit seid!"},
    {f:"ich will mehr", a:"Mehr! Dann gebt Franz auch mehr. Was bietet Ihr mehr?"},
    {f:"kannst du mehr geben", a:"Mehr geben! Franz schaut... Für Euch 5% mehr. Einverstanden?"},
    {f:"noch ein versuch", a:"Noch ein Versuch! Franz ist bereit! Was bietet Ihr?"},
    {f:"können wir neu verhandeln", a:"Neu verhandeln! Immer möglich bei Franz! Was schwebt Euch vor?"},
 
    {f:"erkläre mir die warenstufen", a:"Gold Stufe 1 wertvollst, Vieh Stufe 3, Wolle Stufe 5, Feuerstein Stufe 8, Bretter Stufe 15, Holz Stufe 20 günstigst!"},
    {f:"was ist am wertvollsten", a:"Gold! Stufe 1 bei Franz. Das Wertvollste auf dem Markt!"},
    {f:"was ist am günstigsten", a:"Holz und Zaun! Stufe 20. Überall zu finden aber immer handelbar!"},
    {f:"wie rechnet man tauschkurs", a:"Menge mal Stufe muss gleich sein! 1 Gold mal 1 gleich 20 Holz mal 20. Franz erklärt es gerne!"},
    {f:"was ist feuerstein wert", a:"Feuerstein ist Stufe 8. 8 Stück für 1 Gold bei Franz!"},
    {f:"was ist wolle wert", a:"Wolle ist Stufe 5. 4 Stück für 1 Gold bei Franz!"},
    {f:"was ist gold wert", a:"Gold ist Stufe 1 - das Wertvollste! 1 Gold für 20 Holz oder 4 Wolle!"},
    {f:"was ist holz wert", a:"Holz ist Stufe 20 - günstig. 20 Stück für 1 Gold bei Franz!"},
    {f:"was ist eine axt wert", a:"Eine Axt ist 3 Gold oder 60 Holz wert bei Franz!"},
    {f:"was ist eine hacke wert", a:"Eine Hacke ist 2 Gold oder 40 Holz wert bei Franz!"},
    {f:"was sind himbeeren wert", a:"Himbeeren sind Stufe 12. 2 Himbeeren für 1 Gold bei Franz!"},
    {f:"was lohnt sich zu sammeln", a:"Feuerstein! Stufe 8, gut zu finden, immer gefragt bei Franz!"},
    {f:"was soll ich als anfänger kaufen", a:"Als Anfänger: Erst eine Axt! Damit Holz fällen, dann Gold verdienen!"},
    {f:"wie fange ich an", a:"Fangt mit einer Axt von Franz an! Dann Holz fällen, dann Gold tauschen!"},
    {f:"was ist der beste tausch", a:"Äxte kaufen und verkaufen! 60 Holz rein, 3 Gold raus. Franz verrät Euch sein Geheimnis!"},
    {f:"was kaufen die leute am meisten", a:"Äxte, Wolle und Feuerstein! Das sind die Bestseller bei Franz!"},
    {f:"empfiehlst du etwas", a:"Franz empfiehlt: Feuerstein sammeln und bei Franz gegen Gold tauschen!"},
    {f:"was ist dein lieblingsartikel", a:"Gold! Es glänzt und jeder will es. Ein Händlertraum für Franz!"},
    {f:"hast du alles was ich brauche", a:"Fast alles! Franz hat großes Lager. Was sucht Ihr genau?"},
    {f:"hast du frische waren", a:"Alles frisch! Franz bekommt täglich neue Lieferungen. Nur das Beste!"},
];

function franzAntwort(eingabe) {
    let e = eingabe.toLowerCase().trim()
        .replace(/[.,!]/g, '')
        .replace(/ä/g, 'ä').replace(/ö/g, 'ö').replace(/ü/g, 'ü');
 
    let treffer = FRANZ_DATEN.find(d => d.f === e);
    if (treffer) return treffer.a;
 
    treffer = FRANZ_DATEN.find(d => e.includes(d.f));
    if (treffer) return treffer.a;
 
    treffer = FRANZ_DATEN.find(d => d.f.includes(e) && e.length > 4);
    if (treffer) return treffer.a;
 
    let schluesswoerter = [
        {w:["axt","hacke"], r:"[DEAL:gebe:axt:1:bekomme:gold:3] Eine Axt kostet 3 Gold oder 60 Holz bei Franz! Was bietet Ihr?"},
        {w:["hacke"], r:"[DEAL:gebe:hacke:1:bekomme:gold:2] Eine Hacke kostet 2 Gold oder 40 Holz bei Franz! Was bietet Ihr?"},
        {w:["himbeere","himbeeren"], r:"Himbeeren! Was bietet Ihr Franz dafür? Gold, Holz oder Wolle?"},
        {w:["gold"], r:"Gold! Das Edelste! Was bietet Ihr Franz dafür? 20 Holz, 4 Wolle oder 8 Feuerstein!"},
        {w:["holz"], r:"Holz! Franz nimmt 20 Holz für 1 Gold. Was wollt Ihr dafür?"},
        {w:["wolle"], r:"Wolle! Franz nimmt 4 Wolle für 1 Gold. Was wollt Ihr dafür?"},
        {w:["feuerstein"], r:"Feuerstein! Franz nimmt 8 Stück für 1 Gold. Was wollt Ihr dafür?"},
        {w:["fleisch"], r:"Fleisch! Franz nimmt 4 Stück für 1 Gold. Was wollt Ihr dafür?"},
        {w:["karote","karotten"], r:"Karotten! Franz nimmt 2 Stück für 1 Gold. Was wollt Ihr dafür?"},
        {w:["tausch","handel","kauf","kauf"], r:"Handeln! Franz ist bereit! Was habt Ihr und was braucht Ihr?"},
        {w:["preis","teuer","billig","rabatt","günst"], r:"Preis verhandeln! Franz gibt 10% Rabatt für nette Kunden. Was wollt Ihr?"},
        {w:["ja","ok","deal","einverstanden","abgemacht"], r:"[DEAL:gebe:gold:1:bekomme:holz:20] Sehr gut! Franz macht den Deal! Handel abgeschlossen!"},
        {w:["nein","nö","nicht"], r:"Schade! Franz versteht. Kommt wieder wenn Ihr bereit seid!"},
        {w:["hallo","hi","hey","moin"], r:"Guten Tag! Ich bin Franz, der Händler! Was kann ich für Euch tun?"},
        {w:["tschüss","bye","wiedersehen"], r:"Auf Wiedersehen! Franz freut sich auf Euren nächsten Besuch!"},
    ];
 
    for (let s of schluesswoerter) {
        if (s.w.some(w => e.includes(w))) return s.r;
    }

    let fallbacks = [
        "Hmm, das hat Franz nicht ganz verstanden. Sagt es etwas anders!",
        "Franz hört Euch! Aber konnte das nicht zuordnen. Was meint Ihr genau?",
        "Interessant! Franz denkt nach... Könnt Ihr es anders formulieren?",
        "Franz ist 51 Jahre alt aber das war neu für ihn! Sagt es nochmal anders!",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
 
async function haendlerKIAnfrage(nachricht) {
    haendlerWartet = true;
 
    await new Promise(resolve => setTimeout(resolve, 400));
 
    let text = franzAntwort(nachricht);
 
    let dealMatch = text.match(/\[DEAL:gebe:(\w+):(\d+):bekomme:(\w+):(\d+)\]/i);
    if (dealMatch) {
        text = text.replace(dealMatch[0], '').trim();
        letzterDeal = {
            gebe: dealMatch[1].toLowerCase(),
            gebeAnzahl: int(dealMatch[2]),
            bekomme: dealMatch[3].toLowerCase(),
            bekommeAnzahl: int(dealMatch[4])
        };
        text += ' Einverstanden? (ja / nein)';
    }
 
    haendlerVerlauf.push({ von: 'haendler', text: text });
    haendlerWartet = false;
}