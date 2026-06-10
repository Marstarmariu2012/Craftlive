import torch
import json
import os
from galileo_model import GalileoTransformer
from train import trainiere_modell

# --- 1. GLOBALE SETUP-VARIABLEN ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = None
word_to_int = {}
int_to_word = {}

# --- 2. SYNONYM-TABELLE ---
# Wörter die dasselbe bedeuten werden auf ein Hauptwort gemappt
SYNONYME = {
    # Dankbarkeit
    "bitte":        "danke",
    "danke":        "danke",
    "dankeschön":   "danke",
    "danke schön":  "danke",
    "vielen dank":  "danke",
    "thx":          "danke",
    "ty":           "danke",
    "merci":        "danke",

    # Begrüßung
    "hey":          "hallo",
    "hi":           "hallo",
    "moin":         "hallo",
    "servus":       "hallo",
    "grüß gott":    "hallo",
    "guten tag":    "hallo",
    "guten morgen": "hallo",
    "guten abend":  "hallo",

    # Verabschiedung
    "tschüss":      "auf wiedersehen",
    "ciao":         "auf wiedersehen",
    "bye":          "auf wiedersehen",
    "tschau":       "auf wiedersehen",
    "bis dann":     "auf wiedersehen",

    # Zustimmung
    "ja":           "ja",
    "jap":          "ja",
    "jo":           "ja",
    "genau":        "ja",
    "stimmt":       "ja",
    "korrekt":      "ja",

    # Ablehnung
    "nein":         "nein",
    "nö":           "nein",
    "ne":           "nein",
    "niemals":      "nein",
}

def synonyme_ersetzen(text):
    """Ersetzt Synonyme im Text bevor das Modell antwortet."""
    # Zuerst Mehrwort-Synonyme prüfen (z.B. "vielen dank")
    text_lower = text.lower()
    for synonym, hauptwort in SYNONYME.items():
        if " " in synonym and synonym in text_lower:
            text_lower = text_lower.replace(synonym, hauptwort)

    # Dann Einzelwörter ersetzen
    woerter = text_lower.split()
    woerter = [SYNONYME.get(w, w) for w in woerter]
    return " ".join(woerter)

def lade_modell():
    global model, word_to_int, int_to_word
    if not os.path.exists("galileo.pth"):
        print("❌ galileo.pth nicht gefunden! Bitte erst train.py ausführen.")
        exit()

    checkpoint = torch.load("galileo.pth", map_location=device, weights_only=False)
    c = checkpoint['config']
    word_to_int = checkpoint['word_to_int']
    int_to_word = checkpoint['int_to_word']

    model = GalileoTransformer(checkpoint['vocab_size'], c['embed'], c['heads'], c['hidden'], c['layers']).to(device)
    model.load_state_dict(checkpoint['model_state'])
    model.eval()
    print("✅ Modell erfolgreich geladen.")

# Initiales Laden
lade_modell()

def chatte(text):
    global model, word_to_int, int_to_word

    # --- LOGIK: AUTOMATISCH LERNEN ---
    if text.lower().startswith("lerne:"):
        try:
            if "bedeutet" not in text.lower():
                return "Bitte nutze: Lerne: [Wort] bedeutet [Erklärung]"

            inhalt = text[6:].split("bedeutet")
            neue_frage = inhalt[0].strip()
            neue_antwort = inhalt[1].strip()

            with open("daten.json", "r+", encoding="utf-8") as f:
                data = json.load(f)
                data.append({"frage": neue_frage, "antwort": neue_antwort})
                f.seek(0)
                json.dump(data, f, indent=2, ensure_ascii=False)

            print("Galileo: Ich schreibe das in mein Buch... Moment...")
            trainiere_modell(epochen=500)
            lade_modell()
            return f"Alles klar! Ich habe gelernt, was '{neue_frage}' bedeutet."
        except Exception as e:
            return f"Fehler beim Lernen: {e}"

    # --- SYNONYME ERSETZEN ---
    # Der Text wird "übersetzt" bevor das Modell ihn verarbeitet
    verarbeiteter_text = synonyme_ersetzen(text)

    # --- NORMALER CHAT ---
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

# --- CHAT START ---
print("\n✨ Galileo ist bereit! Tippe 'Lerne: [A] bedeutet [B]' um mich zu füttern.")
print("   Tippe 'exit' zum Beenden.\n")
while True:
    u = input("Du: ")
    if u.lower() in ["exit", "beenden", "quit"]:
        print("Galileo: Auf Wiedersehen!")
        break
    if not u.strip():
        continue

    antwort = chatte(u)
    print(f"Galileo: {antwort}\n")
