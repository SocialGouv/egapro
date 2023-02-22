from datetime import datetime
from pathlib import Path

from fpdf import fpdf


def as_date(d):
    if not d:
        return None
    if not isinstance(d, datetime):
        d = datetime.fromisoformat(d)
    return d.date().strftime("%d/%m/%Y")


class PDF(fpdf.FPDF):
    LABELS = {}

    def __init__(self, *args, **kwargs):
        kwargs["font_cache_dir"] = "/tmp/"
        super().__init__(*args, **kwargs)
        root = Path(__file__).parent
        self.add_font("Marianne", "", root / "font/Marianne-Regular.ttf", uni=True)
        self.add_font(
            "Marianne", "I", root / "font/Marianne-RegularItalic.ttf", uni=True
        )
        self.add_font("Marianne", "B", root / "font/Marianne-Bold.ttf", uni=True)
        self.add_font("Marianne", "BI", root / "font/Marianne-BoldItalic.ttf", uni=True)
        self.add_page()

    def __call__(self, path=None):
        return self.output(path)

    def header(self):
        self.image(Path(__file__).parent / "logo.jpeg", 9, 8.7, 33)
        self.set_font("Marianne", "B", 15)
        # Move to the right
        self.cell(35)
        self.multi_cell(0, 18, txt=self.heading, max_line_height=6, ln=3, align="L")
        self.ln(20)

    def write_pair(self, key, value, height, key_width, value_width):
        if key != " ":
            self.set_font("Marianne", "B", 11)
            self.multi_cell(key_width, height, key, ln=3, align="L", max_line_height=5)

        align = "R" if key != " " else "L"
        self.set_font("Marianne", "", 11)
        self.multi_cell(value_width, height, value, ln=3, align=align, max_line_height=5)
        self.ln(height*1.25)

    def write_headline(self, value):
        self.ln(8)
        self.set_font("Marianne", "B", 14)
        self.write(6, str(value))
        self.ln(6)
        # Sort of hr.
        self.line(self.l_margin, self.y, self.w - self.r_margin, self.y)
        self.ln(2)

    def write_table(self, title, cells):
        # 80 chars per line; each line is 10 height.
        h = (len(title) / 80 + 1) * 10
        table = []

        # filter empty cells of NoneType value
        cells = (c for c in cells if c != (None, None))

        for key, value in cells:
            key, value = self.normalize_pair(key, value)
            height, key_width, value_width = self.compute_row_height(key, value)
            h += height
            table.append((key, value, height, key_width, value_width))
        self.add_page() if title == "Objectifs de progression" else self._perform_page_break_if_need_be(h)
        self.write_headline(title)
        for key, value, height, key_width, value_width in table:
            self.write_pair(key, value, height, key_width, value_width)

    def compute_row_height(self, key, value):
        # Compute each cell width, and total height
        key_len = len(key)
        value_len = len(value)
        key_part = key_len / (value_len + key_len)
        # epw is the effetive page width.
        # Make sure we always let at least 50 mm for each cell.
        key_width = min(max(50, self.epw * key_part), self.epw - 50)
        value_width = self.epw - key_width
        max_len = max(key_len, value_len)
        # A char is more or less 2 mm width.
        letters_per_row = max(key_width, value_width) / 2
        height = (int(max_len / letters_per_row) + 1) * 5
        return height, key_width, value_width

    def normalize_pair(self, key, value):
        key = f"{key} "
        if value is None:
            value = " - "
        if isinstance(value, float):
            value = f"{value:.2f}"
        value = str(self.LABELS.get(value, value))
        return key, value
