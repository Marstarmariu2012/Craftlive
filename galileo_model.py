import torch
import torch.nn as nn
import math

class GalileoTransformer(nn.Module):
    def __init__(self, vocab_size, embed_size, num_heads, hidden_size, num_layers):
        super(GalileoTransformer, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_size)
        
        # Positional Encoding (damit die KI die Reihenfolge der Wörter lernt)
        self.pos_encoder = nn.Parameter(torch.zeros(1, 1000, embed_size))
        
        # Das Herzstück: Der Transformer
        encoder_layers = nn.TransformerEncoderLayer(d_model=embed_size, nhead=num_heads, dim_feedforward=hidden_size, batch_first=True)
        self.transformer_encoder = nn.TransformerEncoder(encoder_layers, num_layers=num_layers)
        
        self.fc_out = nn.Linear(embed_size, vocab_size)

    def forward(self, x):
        # x shape: [batch, seq_len]
        seq_len = x.size(1)
        x = self.embedding(x) + self.pos_encoder[:, :seq_len, :]
        
        # Transformer-Magie
        x = self.transformer_encoder(x)
        
        # Wir nehmen nur die Vorhersage für das letzte Wort der Sequenz
        out = self.fc_out(x) 
        return out