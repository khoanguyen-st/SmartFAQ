import random
import unicodedata
from pathlib import Path

OUTPUT_FILE = Path(__file__).resolve().parent / "data.txt"

class TeencodeMorpher:
    TEEN_MAP = {
        "kh": ["k", "x", "kh"],
        "ph": ["f", "ph", "ff"],
        "qu": ["w", "q", "qu"],
        "ng": ["g", "q", "ng"],
        "th": ["t", "tk", "th"],
        "ch": ["ck", "k", "ch"],
        "tr": ["ch", "tr"],
        "gi": ["j", "z", "dz", "gi"],
        "nh": ["nk", "nh"],
        "gh": ["g", "gh"],

        "a": ["4", "a", "@"],
        "e": ["3", "e"],
        "i": ["1", "j", "i"],
        "o": ["0", "o"],
        "y": ["i", "j", "y"],

        "c": ["k", "c"],
        "d": ["z", "d"],
        "đ": ["d"],
        "v": ["z", "v"],
        "s": ["x", "s"],
        "x": ["s", "x"],

        "ô": ["o", "0"],
        "ơ": ["o"],
        "â": ["a", "4"],
        "ă": ["a", "4"],
        "ê": ["e", "3"],
        "ư": ["u", "w"]
    }

    @staticmethod
    def remove_accents(text: str) -> str:
        if not text: return ""
        nfkd = unicodedata.normalize('NFKD', text)
        res = "".join([c for c in nfkd if not unicodedata.combining(c)])
        return res.replace('đ', 'd').replace('Đ', 'D')

    @staticmethod
    def to_teencode(text: str) -> str:
        if random.random() > 0.5:
            text = TeencodeMorpher.remove_accents(text)

        words = text.lower().split()
        new_words = []

        for word in words:
            temp = word
            for k, v in TeencodeMorpher.TEEN_MAP.items():
                if k in temp and random.random() > 0.4:
                    temp = temp.replace(k, random.choice(v))
            new_words.append(temp)

        return " ".join(new_words)

class DatasetGenerator:
    def __init__(self, output_path: Path):
        self.output_path = output_path
        self.data = set()
        self.morpher = TeencodeMorpher()

    def generate(self):
        print("Generating Data with Advanced Teencode...")

        vi_samples = [
            "trường mình ở đâu", "học phí bao nhiêu", "ngành công nghệ thông tin",
            "cho em hỏi chút", "lịch thi lại", "đăng ký tín chỉ", "bị lỗi rồi ad ơi",
            "mạng lag quá", "không vào được web", "tài khoản bị khóa",
            "điểm rèn luyện", "xin giấy xác nhận", "thầy cô giáo", "phòng đào tạo",
            "có học bổng không", "xét tuyển học bạ", "điểm chuẩn năm nay",
            "tư vấn giúp mình", "làm sao để nộp đơn", "bao giờ có kết quả",
            "em muốn hỏi về ktx", "thủ tục nhập học", "bảo lưu kết quả",
            "quên mật khẩu", "reset password giúp em", "wifi thư viện yếu quá"
        ]

        for s in vi_samples:
            self.data.add(f"__label__vi {s}")
            self.data.add(f"__label__vi {self.morpher.remove_accents(s)}")
            for _ in range(20):
                self.data.add(f"__label__vi {self.morpher.to_teencode(s)}")

        en_samples = [
            "hello admin", "how are you", "what is the tuition fee",
            "where is the campus", "i cannot login", "system error",
            "please help me", "information technology major", "scholarship requirements",
            "computer science", "business administration", "english program",
            "can i change my password", "deadline for submission", "contact number",
            "fail to connect", "server down", "lagging", "wifi password"
        ]

        for s in en_samples:
            self.data.add(f"__label__en {s}")
            s_short = s.lower().replace('please', 'pls').replace('you', 'u').replace('are', 'r').replace('password', 'pwd')
            self.data.add(f"__label__en {s_short}")

    def save(self):
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        final_list = list(self.data)

        if len(final_list) > 5000:
            final_list = random.sample(final_list, 5000)
        random.shuffle(final_list)

        with open(self.output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(final_list))
        print(f"Generated {len(final_list)} lines with mixed Teencode/Leetspeak.")

if __name__ == "__main__":
    g = DatasetGenerator(OUTPUT_FILE)
    g.generate()
    g.save()
