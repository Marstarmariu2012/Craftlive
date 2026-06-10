from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import json
import os
from galileo_model import GalileoTransformer

app = Flask(__name__)
CORS(app)  # Erlaubt Anfragen vom Browser

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = None
word_to_int = {}
int_to_word = {}

SYNONYME = {
    "bitte":"danke","danke":"danke","dankeschön":"danke","vielen dank":"danke",
    "thx":"danke","ty":"danke","hey":"hallo","hi":"hallo","moin":"hallo",
    "servus":"hallo","guten tag":"hallo","guten morgen":"hallo","guten abend":"hallo",
    "tschüss":"auf wiedersehen","ciao":"auf wiedersehen","bye":"auf wiedersehen",
    "ja":"ja","jap":"ja","jo":"ja","genau":"ja","stimmt":"ja",
    "nein":"nein","nö":"nein","ne":"nein",
}

def synonyme_ersetzen(text):
    text_lower = text.lower()
    for synonym, hauptwort in SYNONYME.items():
        if " " in synonym and synonym in text_lower:
            text_lower = text_lower.replace(synonym, hauptwort)
    woerter = text_lower.split()
    woerter = [SYNONYME.get(w, w) for w in woerter]
    return " ".join(woerter)

def lade_modell():
    global model, word_to_int, int_to_word
    if not os.path.exists("galileo.pth"):
        print("❌ galileo.pth nicht gefunden!")
        return False
    checkpoint = torch.load("galileo.pth", map_location=device, weights_only=False)
    c = checkpoint['config']
    word_to_int = checkpoint['word_to_int']
    int_to_word = checkpoint['int_to_word']
    model = GalileoTransformer(checkpoint['vocab_size'], c['embed'], c['heads'], c['hidden'], c['layers']).to(device)
    model.load_state_dict(checkpoint['model_state'])
    model.eval()
    print("✅ Galileo Modell geladen!")
    return True

def chatte(text):
    verarbeiteter_text = synonyme_ersetzen(text)
    input_words = verarbeiteter_text.lower().replace("?", " ?").replace("!", " !").split()
    unk_id = word_to_int.get("<UNK>", 0)
    sep_id = word_to_int.get("-->", 0)
    ids = [word_to_int.get(w, unk_id) for w in input_words]
    ids.append(sep_id)
    antwort_satz = []
    for _ in range(25):
        input_tensor = torch.tensor([ids]).to(device)
        with torch.no_grad():
            output = model(input_tensor)
            next_id = torch.argmax(output[:, -1, :], dim=1).item()
            wort = int_to_word[next_id]
            if wort == "-->" or wort in [".", "!", "?"]:
                if wort in [".", "!", "?"]: antwort_satz.append(wort)
                break
            antwort_satz.append(wort)
            ids.append(next_id)
    return " ".join(antwort_satz) if antwort_satz else "..."

@app.route('/chat', methods=['POST'])
def chat_route():
    daten = request.get_json()
    nachricht = daten.get('message', '')
    if not nachricht.strip():
        return jsonify({'response': '...'})
    antwort = chatte(nachricht)
    return jsonify({'response': antwort})

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok', 'message': 'Galileo läuft!'})

if __name__ == '__main__':
    if lade_modell():
        print("\n✨ Galileo Server läuft auf http://localhost:5000")
        print("   Lasse dieses Fenster offen während du spielst!\n")
        app.run(host='localhost', port=5000, debug=False)
    else:
        print("Fehler: Modell konnte nicht geladen werden.")
