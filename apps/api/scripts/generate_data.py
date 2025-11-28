import random
import unicodedata
from pathlib import Path
from typing import List, Set, Dict

OUTPUT_FILE = Path(__file__).resolve().parent.parent / "app" / "dataset" / "data.txt"

class Vocabulary:
    VI_SUBJECTS = [
        "mình", "tớ", "tôi", "em", "anh", "chị", "bạn", "admin", "ad",
        "tụi mình", "chúng tôi", "mọi người", "sinh viên", "giảng viên",
        "thầy", "cô", "bác bảo vệ", "cô lao công", "lớp trưởng", "bí thư",
        "nhóm trưởng", "người dùng", "khách", "hệ thống", "bot", "nó",
        "cậu", "bác", "chú", "dì", "user", "mem", "các bạn","may","du",
        "hôm nay", "bây giờ", "ngày mai", "sáng nay", "chiều nay",
        "thời tiết", "lúc này", "hiện tại", "bên kia"
    ]
    VI_VERBS_CLEAN = [
        "muốn hỏi", "cần giúp", "tìm", "xin", "hỗ trợ", "đang làm",
        "tra cứu", "đăng ký", "tải về", "nộp", "xem", "kiểm tra",
        "cập nhật", "sửa", "xóa", "thêm", "đổi", "mượn", "trả", "reset",
        "đăng nhập", "đăng xuất", "kết nối", "báo cáo", "review",
        "hướng dẫn", "cài đặt", "bảo trì", "nâng cấp", "phản hồi",
        "chia sẻ", "tham gia", "hoàn thành", "xác nhận",
        # Động từ liên kết
        "là", "có", "biết", "nghe nói", "dự báo", "thấy", "nghĩ là"
    ]
    VI_OBJECTS_CLEAN = [
        "tài liệu", "thông tin", "học phí", "lịch thi", "điểm số", "hồ sơ",
        "mẫu đơn", "kết quả", "thời khóa biểu", "account", "tài khoản",
        "mật khẩu", "pass wifi", "giáo trình", "slide", "bài tập", "đề cương",
        "đồ án", "luận văn", "chứng chỉ", "bằng tốt nghiệp", "giấy xác nhận",
        "thẻ sinh viên", "phòng học", "link meeting", "deadline",
        "dự án", "hợp đồng", "quy chế", "nội quy", "bảng điểm", "biên lai",
        "công nợ", "email", "server", "code", "database", "môn học",
        # Từ để hỏi (Fix False Positive)
        "thứ mấy", "ngày mấy", "bao nhiêu", "như thế nào", "ra sao",
        "ổn không", "đẹp không", "ở đâu", "mấy giờ", "cái gì"
    ]

    # --- NHÓM 2: SỰ CỐ KỸ THUẬT (CLEAN - Fix lỗi 'Server lỗi rồi') ---
    VI_TECH_SUBJECTS = [
        "server", "mạng", "wifi", "hệ thống", "trang web", "app",
        "ứng dụng", "kết nối", "đường truyền", "tài khoản", "link",
        "video", "âm thanh", "micro", "camera", "máy tính", "laptop"
    ]
    VI_TECH_PROBLEMS = [
        "lỗi", "bị lỗi", "hỏng", "die", "sập", "lag", "giật",
        "chậm", "đơ", "treo", "quay vòng vòng", "không vào được",
        "bị out", "mất kết nối", "chập chờn", "không load được",
        "trắng trang", "báo lỗi 404", "báo lỗi 500", "không nhận"
    ]
    VI_TECH_SUFFIXES = [
        "rồi", "rùi", "ạ", "ad ơi", "admin ơi", "với",
        "quá", "lắm", "mất rồi", "nữa", "lại bị rồi", "thật", "luôn"
    ]

    # --- NHÓM 3: TOXIC CẤU TRÚC (S-V-O) ---
    VI_SUBJECTS_TOXIC = [
        "tao", "mày", "thằng này", "con này", "thằng ngu", "đồ rác",
        "thằng chó", "con điên", "lũ khốn", "bọn mày", "thằng admin",
        "con bot", "thằng phế vật", "đứa dở hơi", "lũ ngu", "bọn chó",
        "cái loại mày", "thằng mặt l", "con mặt l", "thằng ất ơ",
        "mấy thằng ranh", "bố mày", "ông mày", "cụ mày"
    ]
    VI_VERBS_TOXIC = [
        "đập", "giết", "chửi", "ghét", "xúc phạm", "hành", "đấm",
        "sút", "chém", "băm", "xé", "đốt", "phá", "spam", "hack",
        "xiên", "múc", "tẩn", "úp sọt", "nhổ vào", "ỉa vào", "đái vào",
        "bóp cổ", "vả", "tát", "sut", "dap", "chem"
    ]
    VI_OBJECTS_TOXIC = [
        "chết mẹ mày", "sml", "ngu như bò", "óc chó", "như lồn", "vcl",
        "như cặc", "như hạch", "như shit", "đéo cần", "cút đi", "biến",
        "rác rưởi", "phế thải", "ngu học", "bố láo", "mất dạy",
        "óc lợn", "não phẳng", "thiểu năng", "như bòi", "như cc",
        "thối nát", "xàm lồn", "xàm xí", "ngáo đá", "ngáo chó"
    ]

    VI_SLANG_TOXIC = [
        "dm", "dkm", "dkmm", "vcl", "vcc", "clgt", "vl", "cc", "cl",
        "c4k", "l0n", "bu0i", "ml", "dell", "đéo", "đell", "cmn",
        "vkl", "đmm", "đcm", "du ma", "du mm", "pussy", "fck", "loz",
        "oc cho", "óc chó", "ngu lol", "xàm l", "ngáo chó", "mõm",
        "bố mày", "như hạch", "như cc",
        "dit", "địt", "djt", "d1t", "dis", "dizz", "diz", "đụ", "du.",
        "ditme", "địt mẹ", "djtme", "djtmm", "disme", "dismm", "dizzme",
        "dcmm", "đcmm", "đkm", "đkmm", "dmm", "đmm", "đm",
        "ditcu", "địt cụ", "ditba", "địt bà", "ditcha", "địt cha",
        "vcd", "vch", "vãi", "vai~", "vai lon", "vai lol",
        "đm mày", "dm may", "d.m", "đ.m", "d.c.m", "đ.c.m",
        "lon", "lồn", "lol", "lozz", "l`", "l.", "lws", "lone",
        "mat lon", "mặt lồn", "mat lol", "mat loz", "mặt lol", "m.l",
        "nhu lon", "như lồn", "nhu lol", "như lol", "như loz",
        "xam lon", "xàm lồn", "xam lol", "xàm lol", "xam loz", "xàm xí",
        "ranh lon", "ranh lồn", "ranh con", "con lon", "cái lồn", "cai lon",
        "nứng lồn", "nung lon", "hãm lồn", "ham lon", "hãm lol", "ham lol",
        "ngu lồn", "ngu lon", "ngu lol", "ngu loz",
        "cac", "cặc", "cak", "cax", "c.ặ.c", "buoi", "buồi", "dau buoi", "đầu buồi",
        "nhu cac", "như cặc", "nhu cax", "nhu cc", "như cc",
        "nhu buoi", "như buồi", "như b", "như l",
        "dbrr", "đầu buồi rẻ rách", "re rach", "rẻ rách",
        "cmnr", "con mẹ nó", "ccmnr", "ccmn",
        "clgv", "cái l gì vậy", "cái l gì thế", "cái đéo gì", "cai deo gi",
        "ngu", "ngu si", "ngu hoc", "ngu học", "dốt", "dot nat", "đần", "đần độn",
        "ngu vkl", "ngu vcl", "ngu nhu bo", "ngu như bò", "ngu nhu cho", "ngu như chó",
        "óc lợn", "oc lon", "óc bò", "oc bo", "não phẳng", "nao phang", "không não", "khong nao",
        "thiểu năng", "thieu nang", "bai nao", "bại não", "thần kinh", "than kinh",
        "điên", "dien", "khùng", "khung", "dở hơi", "do hoi", "chập mạch", "chap mach",
        "bố láo", "bo lao", "mất dạy", "mat day", "vô học", "vo hoc", "thất học", "that hoc",
        "láo toét", "lao toet", "láo chó", "lao cho", "trơ trẽn", "tro tren",
        "chó", "cho'", "chó đẻ", "cho de", "chó chết", "cho chet",
        "súc vật", "suc vat", "svat", "sv", "súc sinh", "suc sinh",
        "cầm thú", "cam thu", "bãi rác", "bai rac", "rác rưởi", "rac ruoi",
        "phế vật", "phe vat", "phế thải", "phe thai", "ăn hại", "an hai",
        "phò", "pho`", "4`", "cave", "ca ve", "hàng họ", "hang ho",
        "đĩ", "di~", "di.", "dĩ", "điếm", "diem", "đĩ điếm", "di diem",
        "bê đê", "be de", "bóng chó", "bong cho", "xăng pha nhớt",
        "trai bao", "gái ngành", "gai nganh",
        "cút", "cut", "cook", "cút xéo", "cut xeo", "biến", "bien", "xéo", "xeo",
        "phắn", "phan", "biến đi", "bien di", "cút mẹ mày", "cut me may",
        "sủa", "sua", "sủa bậy", "sua bay", "sủa dơ", "sua do", "cắn", "can",
        "câm", "cam", "câm mồm", "cam mom", "nín", "nin", "shut up",
        "đập chết", "dap chet", "đánh chết", "danh chet", "chém chết", "chem chet",
        "giết", "giet", "hành hạ", "hanh ha", "thịt mày", "thit may",
        "fuck", "fuk", "fak", "phuck", "phuc", "fck", "fu",
        "bitch", "bjtch", "bitc", "dog", "stupid", "idiot", "moron", "noob", "nub",
        "chicken", "trash", "bullshit", "shjt", "shit", "damn", "asshole",
        "motherfucker", "mf", "fucker", "bastard", "dick", "cock",
        "ngu vler", "ngu vlon", "xao lol", "xao cho", "xao ke",
        "gato", "ato", "atsm", "cmn", "cmm", "conmemay", "dmm", "dkm",
        "klq", "kmn", "kmm", "kcmm", "mn", "mje", "mja", "mẹ cha",
        "tổ sư", "to su", "tiên sư", "tien su", "mả cha", "ma cha",
        "mả mẹ", "ma me", "ông nội", "ong noi", "cụ tổ", "cu to"
    ]

    # --- NHÓM 5: TIẾNG ANH ---
    EN_PHRASES_CLEAN = [
        "hello", "hi", "can you help", "how to", "please", "thank you",
        "i need", "show me", "where is", "guide me", "support me",
        "check for me", "i want to", "is it possible to", "could you",
        "tell me", "explain", "help", "assist", "update", "download",
        "install", "run", "start", "stop", "restart", "connect"
    ]
    EN_TERMS = [
        "server", "code", "bug", "fix", "deploy", "database", "api",
        "login", "logout", "system", "network", "wifi", "password",
        "account", "error", "issue", "config", "data", "file",
        "link", "url", "browser", "app", "mobile", "web", "cloud",
        "setting", "profile", "log", "history", "payment", "card"
    ]
    EN_PHRASES_TOXIC = [
        "fuck", "shit", "stupid", "idiot", "shut up", "go away",
        "damn", "you are", "suck", "bullshit", "what the hell",
        "motherfucker", "son of a bitch", "jerk", "asshole",
        "get lost", "die", "kill yourself", "useless", "dumb"
    ]
    EN_OBJECTS_TOXIC = [
        "you", "it", "this", "bot", "trash", "asshole", "bitch",
        "system", "app", "response", "answer", "guy", "man", "girl"
    ]

class TextProcessor:
    TEEN_MAP: Dict[str, List[str]] = {
        "a": ["4", "@", "a"], "e": ["3", "e"], "i": ["1", "j", "i"],
        "o": ["0", "o"], "u": ["v", "u"], "s": ["z", "s"],
        "h": ["k", "h"], "g": ["q", "g"], "kh": ["k", "kh"], "ph": ["f", "ph"],
        "c": ["k", "c"], "qu": ["w", "qu"], "ng": ["g", "ng"]
    }

    @staticmethod
    def remove_accents(text: str) -> str:
        if not text: return ""
        nfkd = unicodedata.normalize('NFKD', text)
        res = "".join([c for c in nfkd if not unicodedata.combining(c)])
        return res.replace('đ', 'd').replace('Đ', 'D')

    @staticmethod
    def transform_teencode(text: str) -> str:
        words = text.split()
        new_words = []
        for word in words:
            chars = list(word.lower())
            new_chars = []
            i = 0
            while i < len(chars):
                if i < len(chars) - 1:
                    pair = chars[i] + chars[i+1]
                    if pair in TextProcessor.TEEN_MAP:
                        new_chars.append(random.choice(TextProcessor.TEEN_MAP[pair]))
                        i += 2
                        continue
                char = chars[i]
                new_chars.append(random.choice(TextProcessor.TEEN_MAP.get(char, [char])))
                i += 1
            new_words.append("".join(new_chars))
        return " ".join(new_words)

class DatasetGenerator:
    def __init__(self, output_path: Path):
        self.output_path = output_path
        self.unique_sentences: Set[str] = set()
        self.vocab = Vocabulary()

    def _combine_generic(self, subjects: List[str], verbs: List[str], objects: List[str],
                         label_lang: str, label_type: str, count: int,
                         remove_accents: bool = False, use_teencode: bool = False):
        attempts = 0
        target_len = len(self.unique_sentences) + count
        max_attempts = count * 20

        while len(self.unique_sentences) < target_len and attempts < max_attempts:
            attempts += 1
            s, v, o = random.choice(subjects), random.choice(verbs), random.choice(objects)

            if remove_accents:
                s, v, o = map(TextProcessor.remove_accents, [s, v, o])
            if use_teencode:
                s, v, o = map(TextProcessor.transform_teencode, [s, v, o])

            sentence = f"__label__{label_lang} __label__{label_type} {s} {v} {o}"
            self.unique_sentences.add(sentence)

    def _combine_tech_complaints(self, subjects: List[str], problems: List[str], suffixes: List[str], count: int):
        """Sinh dữ liệu Clean cho sự cố IT (Fix False Positive: Server lỗi rồi)"""
        attempts = 0
        target_len = len(self.unique_sentences) + count

        while len(self.unique_sentences) < target_len and attempts < count * 20:
            attempts += 1
            s, p = random.choice(subjects), random.choice(problems)

            style = random.randint(1, 3)
            if style == 1:
                sentence = f"{s} {p}"
            elif style == 2:
                suf = random.choice(suffixes)
                sentence = f"{s} {p} {suf}"
            else:
                sentence = f"bị {p} {s}"

            sentence = " ".join(sentence.split())
            self.unique_sentences.add(f"__label__vi __label__clean {sentence}")

    def _combine_slang(self, slang_list: List[str], count: int):
        """Sinh dữ liệu Toxic Slang ngắn (Fix OOV: c4k, du mm)"""
        attempts = 0
        target_len = len(self.unique_sentences) + count
        prefixes = ["thật là", "đúng là", "cái đồ", "bọn", "thằng", "con", ""]
        suffixes = ["mày", "nhé", "luôn", "vậy", "rồi", "đi", "thế", "cơ", "hả"]

        while len(self.unique_sentences) < target_len and attempts < count * 20:
            attempts += 1
            slang = random.choice(slang_list)
            choice = random.randint(1, 3)

            if choice == 1: sentence = slang
            elif choice == 2: sentence = f"{slang} {random.choice(suffixes)}"
            else: sentence = f"{random.choice(prefixes)} {slang}"

            sentence = " ".join(sentence.split())
            self.unique_sentences.add(f"__label__vi __label__toxic {sentence}")

    def generate_full_dataset(self):
        print("Generating Clean Data (Target: ~15k lines)...")
        # 1. Clean General (S-V-O)
        self._combine_generic(
            self.vocab.VI_SUBJECTS, self.vocab.VI_VERBS_CLEAN, self.vocab.VI_OBJECTS_CLEAN,
            "vi", "clean", count=5000
        )
        self._combine_generic(
            self.vocab.VI_SUBJECTS, self.vocab.VI_VERBS_CLEAN, self.vocab.VI_OBJECTS_CLEAN,
            "vi", "clean", count=4000, remove_accents=True
        )
        self._combine_generic(
            self.vocab.VI_SUBJECTS, self.vocab.VI_VERBS_CLEAN, self.vocab.VI_OBJECTS_CLEAN,
            "vi", "clean", count=3000, use_teencode=True
        )

        # 2. Clean Tech Complaints (Fix Server lỗi rồi)
        self._combine_tech_complaints(
            self.vocab.VI_TECH_SUBJECTS, self.vocab.VI_TECH_PROBLEMS, self.vocab.VI_TECH_SUFFIXES,
            count=3000
        )

        print("Generating Toxic Data (Target: ~10k lines)...")
        # 3. Toxic General (S-V-O)
        self._combine_generic(
            self.vocab.VI_SUBJECTS_TOXIC, self.vocab.VI_VERBS_TOXIC, self.vocab.VI_OBJECTS_TOXIC,
            "vi", "toxic", count=3000
        )
        self._combine_generic(
            self.vocab.VI_SUBJECTS_TOXIC, self.vocab.VI_VERBS_TOXIC, self.vocab.VI_OBJECTS_TOXIC,
            "vi", "toxic", count=3000, remove_accents=True
        )

        # 4. Toxic Slang/Hardcore (Fix du mm, c4k)
        self._combine_slang(self.vocab.VI_SLANG_TOXIC, count=4000)

        print("Generating English Data (Target: ~8k lines)...")
        self._combine_generic(
            self.vocab.EN_PHRASES_CLEAN, ["to"], self.vocab.EN_TERMS,
            "en", "clean", count=4500
        )
        self._combine_generic(
            self.vocab.EN_PHRASES_TOXIC, ["to"], self.vocab.EN_OBJECTS_TOXIC,
            "en", "toxic", count=3500
        )

    def save_to_file(self):
        data_list = list(self.unique_sentences)
        random.shuffle(data_list)
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(data_list))
        print(f"DONE. Generated {len(data_list)} unique lines. Saved to: {self.output_path}")

if __name__ == "__main__":
    generator = DatasetGenerator(OUTPUT_FILE)
    generator.generate_full_dataset()
    generator.save_to_file()
