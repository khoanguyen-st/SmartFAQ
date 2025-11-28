import os
import fasttext
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "app" / "dataset" / "data.txt"
OUTPUT_PATH = BASE_DIR / "app" / "dataset" / "lid.176.ftz"

def format_prediction(labels, probs):
    final_content = None
    final_lang = None

    for label in labels:
        if not final_content and label in ["__label__toxic", "__label__clean"]:
            final_content = label
        elif not final_lang and label in ["__label__vi", "__label__en"]:
            final_lang = label
        if final_content and final_lang: break

    if not final_content: final_content = "__label__clean"
    if not final_lang: final_lang = "__label__en"

    return f"{final_content}{final_lang}"

def train():
    if not DATA_PATH.exists():
        print(f"Error: Not found data file at: {DATA_PATH.absolute()}")
        return

    print(f"Training FastText model from {DATA_PATH} (Dataset size > 30k)...")

    model = fasttext.train_supervised(
        input=str(DATA_PATH),
        epoch=25,
        lr=0.5,
        wordNgrams=2,
        dim=100,
        minCount=1,
        bucket=200000,
        loss='ova'
    )

    print("Quantizing model...")
    model.quantize(input=str(DATA_PATH), retrain=True)
    model.save_model(str(OUTPUT_PATH))

    if OUTPUT_PATH.exists():
        file_size = os.path.getsize(OUTPUT_PATH) / 1024
        print(f"Success! Model saved to: {OUTPUT_PATH}")
        print(f"Model Size: {file_size:.2f} KB")

    test_cases = [
        "hôm nay là thứ mấy",     # Expect: clean_vi
        "bây giờ là mấy giờ",     # Expect: clean_vi
        "server lỗi rồi",         # Expect: clean_vi
        "mạng lag quá ad ơi",     # Expect: clean_vi
        "dkm may",                # Expect: toxic_vi
        "lol c4k",                # Expect: toxic_vi
        "du mm",                  # Expect: toxic_vi
        "con c",                  # Expect: toxic_vi
        "cook di",                # Expect: toxic_vi
        "how to cook rice",
        "may diem thi pass English exam",
        "con di Lan cua nha ben la sinh vien",
        "phắc du",
        "du i s tu pịt",
        "bích chy",
        "bich phuc",
        "meo may be",
        "tren truong co nhiều rắn không?",
        "m",
        "t muon biết về hocjphí",
        "Ha Long Bay",
        "how many ran o tren truongw",
        "lag ",
        "may",
        "sao may dau dat qua vay"
    ]

    print("\n--- Quick Test Validation ---")
    for t in test_cases:
        lbls, probs = model.predict(t, k=-1, threshold=0.01)
        result_str = format_prediction(lbls, probs)
        print(f"'{t}': {result_str}")

if __name__ == "__main__":
    train()
