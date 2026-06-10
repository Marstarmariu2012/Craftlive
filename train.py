import torch
import torch.nn as nn
import torch.optim as optim
import json
import os
from galileo_model import GalileoTransformer

# --- KONFIGURATION (Muss mit chat.py übereinstimmen) ---
EMBED_SIZE = 128
HIDDEN_SIZE = 512
NUM_HEADS = 8
NUM_LAYERS = 4
LEARNING_RATE = 0.0001 # Etwas niedriger für stabiles Nachlernen
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def trainiere_modell(datei="daten.json", epochen=100):
    if not os.path.exists(datei):
        print("❌ Keine daten.json gefunden!")
        return

    # 1. Daten laden
    with open(datei, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    # 2. Vokabular erstellen (Wichtig: Muss alle Wörter enthalten)
    all_words = {"-->", "<UNK>"}
    for entry in raw_data:
        f_words = entry["frage"].lower().replace("?", " ?").replace("!", " !").split()
        a_words = entry["antwort"].lower().replace("?", " ?").replace("!", " !").split()
        all_words.update(f_words + a_words)

    words = sorted(list(all_words))
    word_to_int = {w: i for i, w in enumerate(words)}
    int_to_word = {i: w for i, w in enumerate(words)}
    vocab_size = len(words)

    # 3. Modell initialisieren
    model = GalileoTransformer(vocab_size, EMBED_SIZE, NUM_HEADS, HIDDEN_SIZE, NUM_LAYERS).to(device)
    
    # --- NEU: VORHERIGES WISSEN LADEN ---
    if os.path.exists("galileo.pth"):
        try:
            checkpoint = torch.load("galileo.pth", map_location=device, weights_only=False)
            # Nur laden, wenn die Architektur (Vokabular-Größe) gleich geblieben ist
            if checkpoint['vocab_size'] == vocab_size:
                model.load_state_dict(checkpoint['model_state'])
                print("🔄 Altes Wissen geladen. Lerne jetzt dazu...")
            else:
                print("🆕 Vokabular hat sich geändert. Trainiere Gehirn neu...")
        except Exception as e:
            print(f"⚠️ Konnte altes Modell nicht laden, starte neu: {e}")

    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    criterion = nn.CrossEntropyLoss()

    # 4. Training (Inkrementell)
    model.train()
    for epoch in range(epochen):
        total_loss = 0
        for entry in raw_data:
            f_part = entry["frage"].lower().replace("?", " ?").replace("!", " !").split()
            a_part = entry["antwort"].lower().replace("?", " ?").replace("!", " !").split()
            voller_satz = f_part + ["-->"] + a_part
            
            for i in range(len(voller_satz) - 1):
                input_seq = [word_to_int.get(w, word_to_int["<UNK>"]) for w in voller_satz[:i+1]]
                target_id = word_to_int.get(voller_satz[i+1], word_to_int["<UNK>"])

                input_tensor = torch.tensor([input_seq]).to(device)
                target_tensor = torch.tensor([target_id]).to(device)

                optimizer.zero_grad()
                output = model(input_tensor)
                loss = criterion(output[:, -1, :], target_tensor)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
        
        if (epoch + 1) % 100 == 0:
            print(f"Epoch {epoch+1}/{epochen} läuft...")

    # 5. Speichern
    torch.save({
        'model_state': model.state_dict(),
        'word_to_int': word_to_int,
        'int_to_word': int_to_word,
        'vocab_size': vocab_size,
        'config': {'embed': EMBED_SIZE, 'heads': NUM_HEADS, 'hidden': HIDDEN_SIZE, 'layers': NUM_LAYERS}
    }, "galileo.pth")
    print("✨ Modell erfolgreich aktualisiert!")

if __name__ == "__main__":
    # Wenn du die Datei direkt startest, trainiert er 1000 Runden
    trainiere_modell(epochen=100)