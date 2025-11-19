from pathlib import Path
text = Path('src/app/api/payment/webhook/route.ts').read_text(encoding='utf-8')
start = text.find("          // Atualiza a transação no banco de dados")
print(text[start:start+1600])
