function updateHaendler() {
    if (haendlerChat) return;
    if (millis() - haendler.timer > 2500) {
        let optionen = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},{x:0,y:0},{x:0,y:0}];
        let r = random(optionen);
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
    let wipp = sin(haendler.schritt) * 3;

    noStroke();
    fill(0, 0, 0, 40);
    ellipse(haendler.x, haendler.y + 28, 38, 10);

    fill(120, 75, 30);
    rectMode(CENTER);
    rect(haendler.x, haendler.y + 8 + wipp, 34, 44, 4);

    fill(100, 60, 20);
    rect(haendler.x - 22, haendler.y + 5 + wipp, 10, 30, 3);
    rect(haendler.x + 22, haendler.y + 5 + wipp, 10, 30, 3);

    fill(255, 200, 150);
    ellipse(haendler.x - 22, haendler.y + 22 + wipp, 11, 11);
    ellipse(haendler.x + 22, haendler.y + 22 + wipp, 11, 11);

    fill(80, 50, 15);
    rect(haendler.x - 8, haendler.y + 33 + wipp, 12, 18, 2);
    rect(haendler.x + 8, haendler.y + 33 + wipp, 12, 18, 2);

    fill(255, 200, 150);
    ellipse(haendler.x, haendler.y - 20 + wipp, 30, 30);

    fill(60, 40, 20);
    ellipse(haendler.x - 7, haendler.y - 22 + wipp, 5, 5);
    ellipse(haendler.x + 7, haendler.y - 22 + wipp, 5, 5);

    noFill();
    stroke(100, 50, 20);
    strokeWeight(1.5);
    arc(haendler.x, haendler.y - 16 + wipp, 12, 8, 0, PI);

    noStroke();
    fill(60, 35, 10);
    rectMode(CENTER);
    rect(haendler.x, haendler.y - 37 + wipp, 38, 8, 2);
    rect(haendler.x, haendler.y - 46 + wipp, 24, 18, 3);

    fill(180, 130, 50);
    rect(haendler.x, haendler.y - 38 + wipp, 24, 4);

    let spielerWeltX = width/2 - kameraX;
    let spielerWeltY = height/2 - kameraY;
    if (dist(spielerWeltX, spielerWeltY, haendler.x, haendler.y) < 150 && !haendlerChat) {
        fill(255, 240, 150, 230);
        noStroke();
        rectMode(CENTER);
        rect(haendler.x, haendler.y - 70 + wipp, 90, 22, 5);
        fill(50, 30, 0);
        textSize(12);
        textAlign(CENTER);
        text('[E] Handeln', haendler.x, haendler.y - 63 + wipp);
    }
    pop();
}

function drawHaendlerChat() {
    if (!haendlerChat) return;

    rectMode(CORNER);
    fill(15, 10, 5, 235);
    noStroke();
    rect(0, height - 280, width, 280);

    stroke(180, 140, 50);
    strokeWeight(2);
    line(0, height - 280, width, height - 280);
    noStroke();

    fill(255, 200, 150);
    ellipse(30, height - 258, 24, 24);
    fill(60, 35, 10);
    rectMode(CENTER);
    rect(30, height - 273, 28, 6, 2);
    rect(30, height - 279, 18, 12, 2);

    fill(220, 180, 60);
    textSize(15);
    textAlign(LEFT);
    noStroke();
    text('Händler Aldric  –  Tippe & ENTER zum Senden  |  ESC = schließen', 50, height - 252);

    stroke(80, 60, 20);
    strokeWeight(1);
    line(10, height - 242, width - 10, height - 242);
    noStroke();

    let zeigeVon = max(0, haendlerVerlauf.length - 6);
    for (let i = zeigeVon; i < haendlerVerlauf.length; i++) {
        let eintrag = haendlerVerlauf[i];
        let y = height - 230 + (i - zeigeVon) * 32;
        if (eintrag.von === 'spieler') {
            fill(120, 170, 255); textSize(14); textAlign(LEFT);
            text('Du:', 15, y);
            fill(200, 220, 255);
            text(eintrag.text, 50, y);
        } else {
            fill(220, 170, 50); textSize(14); textAlign(LEFT);
            text('Aldric:', 15, y);
            fill(255, 235, 180);
            text(eintrag.text, 70, y);
        }
    }

    fill(30, 22, 10);
    stroke(120, 90, 30);
    strokeWeight(1);
    rectMode(CORNER);
    rect(10, height - 48, width - 130, 38, 5);
    noStroke();
    fill(220, 200, 160);
    textSize(15); textAlign(LEFT);
    text(haendlerInput + (frameCount % 60 < 30 ? '|' : ''), 20, height - 23);

    fill(haendlerWartet ? 60 : 140, haendlerWartet ? 60 : 100, 20);
    stroke(180, 140, 50); strokeWeight(1);
    rectMode(CORNER);
    rect(width - 115, height - 48, 105, 38, 5);
    noStroke();
    fill(255, 240, 180);
    textSize(14); textAlign(CENTER);
    text(haendlerWartet ? '...' : 'Senden', width - 62, height - 23);

    if (haendlerWartet) {
        fill(220, 180, 60, 150 + sin(frameCount * 0.1) * 100);
        textSize(13); textAlign(LEFT);
        text('Aldric überlegt...', 15, height - 58);
    }
}

async function haendlerKIAnfrage(nachricht) {
    haendlerWartet = true;

    let inventarText = inventar
        .filter(s => s !== null)
        .map(s => s.typ + ' x' + s.anzahl)
        .join(', ') || 'leer';

    let systemPrompt = `Du bist Händler Aldric in einem mittelalterlichen Survival-Spiel. Antworte kurz, max 2 Sätze, kein Emoji.
Waren und Wertstufen (niedrig = wertvoller): gold=1, schafe=3, kühe=3, schweine=3, wolle=5, milch=5, fleisch=5, feuerstein=8, stein=8, bretter=15, holz=20, zaun=20, inventarholz=20, karote=10, himbeere=12.
Tauschformel: Menge_A × Stufe_A = Menge_B × Stufe_B. Beispiel: 1 Gold = 20 Holz, 2 Wolle = 5 Bretter.
Spieler-Inventar aktuell: ${inventarText}.
Wenn Spieler concreten Tausch vorschlägt und du zustimmst, schreibe GENAU: [DEAL:gebe:WARE:MENGE:bekomme:WARE:MENGE]
gebe = was Spieler bekommt, bekomme = was Spieler gibt. Nur echte Warennamen verwenden.
Du kannst bei gutem Verhandeln bis 15% Rabatt geben.`;

    let verlaufFürKI = haendlerVerlauf.slice(-8).map(e => ({
        role: e.von === 'spieler' ? 'user' : 'assistant',
        content: e.text
    }));
    verlaufFürKI.push({ role: 'user', content: nachricht });

    try {
        let antwort = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 200,
                system: systemPrompt,
                messages: verlaufFürKI
            })
        });
        let daten = await antwort.json();
        let text = daten.content[0].text;

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
    } catch(e) {
        haendlerVerlauf.push({ von: 'haendler', text: 'Störung beim Handel. Versucht es nochmal!' });
    }
    haendlerWartet = false;
}

function führeDealAus() {
    if (!letzterDeal) return;
    let d = letzterDeal;
    let hatGenug = inventar.some(s => s && s.typ === d.bekomme && s.anzahl >= d.bekommeAnzahl);
    if (!hatGenug) {
        haendlerVerlauf.push({ von: 'haendler', text: 'Ihr habt nicht genug ' + d.bekomme + '! Deal geplatzt.' });
        letzterDeal = null;
        return;
    }
    // Abziehen was Spieler gibt
    for (let i = 0; i < inventar.length; i++) {
        if (inventar[i] && inventar[i].typ === d.bekomme) {
            inventar[i].anzahl -= d.bekommeAnzahl;
            if (inventar[i].anzahl <= 0) inventar[i] = null;
            break;
        }
    }
    // Hinzufügen was Spieler bekommt
    addInventar(d.gebe, d.gebeAnzahl);
    haendlerVerlauf.push({ von: 'haendler', text: 'Ausgezeichnet! Handel abgeschlossen. Kommt bald wieder!' });
    letzterDeal = null;
}
