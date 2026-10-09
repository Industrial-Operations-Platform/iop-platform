"""Render the repository-owned English travel guide as a reviewable PDF."""

from __future__ import annotations

import argparse
import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable, PageBreak, Paragraph, Preformatted,
    SimpleDocTemplate, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[3]
NAVY = colors.HexColor("#19334F")
BLUE = colors.HexColor("#007ABF")
MUTED = colors.HexColor("#61738B")
BORDER = colors.HexColor("#D9E4ED")
PALE = colors.HexColor("#F1F6FA")
WIDTH = A4[0] - 84


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.page_states = []

    def showPage(self):
        self.page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self.page_states)
        for state in self.page_states:
            self.__dict__.update(state)
            self.setStrokeColor(BORDER)
            self.line(42, 36, A4[0] - 42, 36)
            self.setFillColor(MUTED)
            self.setFont("Helvetica", 7.4)
            self.drawString(42, 23, "IOP  |  Native development  |  09 October 2026")
            self.drawRightString(A4[0] - 42, 23, f"{self._pageNumber} / {total}")
            super().showPage()
        super().save()


def header(pdf_canvas, document):
    pdf_canvas.saveState()
    pdf_canvas.setFillColor(NAVY)
    pdf_canvas.setFont("Helvetica-Bold", 8)
    pdf_canvas.drawString(42, A4[1] - 29, "IOP / DEVELOPER FIELD GUIDE")
    pdf_canvas.setFillColor(MUTED)
    pdf_canvas.setFont("Helvetica", 7.5)
    pdf_canvas.drawRightString(A4[0] - 42, A4[1] - 29, "Code snapshot: develop 9fb1da9")
    pdf_canvas.setStrokeColor(BORDER)
    pdf_canvas.line(42, A4[1] - 37, A4[0] - 42, A4[1] - 37)
    pdf_canvas.restoreState()


def styles():
    result = getSampleStyleSheet()
    result.add(ParagraphStyle(
        "GuideTitle", fontName="Helvetica-Bold", fontSize=21, leading=25,
        textColor=NAVY, spaceAfter=15, keepWithNext=True,
    ))
    result.add(ParagraphStyle(
        "GuideBody", fontName="Helvetica", fontSize=9.5, leading=13.1,
        textColor=NAVY, spaceAfter=9, alignment=TA_LEFT,
    ))
    result.add(ParagraphStyle(
        "GuideCell", fontName="Helvetica", fontSize=8.4, leading=11.4,
        textColor=NAVY, spaceAfter=0,
    ))
    result.add(ParagraphStyle(
        "GuideCode", fontName="Courier", fontSize=7.8, leading=10.1,
        textColor=NAVY, backColor=PALE, borderColor=BORDER,
        borderWidth=0.5, borderPadding=7, spaceBefore=3, spaceAfter=11,
    ))
    return result


def inline(text):
    text = html.escape(text)
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)


def flowables(source):
    style = styles()
    lines = source.splitlines()
    output = []
    index = 0
    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
            continue
        if line == "<!-- page -->":
            output.append(PageBreak())
            index += 1
            continue
        if line.startswith("# "):
            output.append(Paragraph(inline(line[2:]), style["GuideTitle"]))
            output.append(HRFlowable(width="100%", thickness=1.5, color=BLUE, spaceAfter=14))
            index += 1
            continue
        if line.startswith("~~~"):
            code = []
            index += 1
            while index < len(lines) and not lines[index].startswith("~~~"):
                if len(lines[index]) > 106:
                    raise ValueError(f"Code line {index + 1} is too long for the PDF.")
                code.append(lines[index])
                index += 1
            if index >= len(lines):
                raise ValueError("Unterminated code fence.")
            output.append(Preformatted("\n".join(code), style["GuideCode"]))
            index += 1
            continue
        if line.startswith("|"):
            rows = []
            while index < len(lines) and lines[index].startswith("|"):
                cells = [cell.strip() for cell in lines[index].strip("|").split("|")]
                if not all(re.fullmatch(r"[-: ]+", cell) for cell in cells):
                    rows.append([Paragraph(inline(cell), style["GuideCell"]) for cell in cells])
                index += 1
            if any(len(row) != 2 for row in rows):
                raise ValueError("This guide uses two-column tables.")
            table = Table(rows, colWidths=[WIDTH * 0.35, WIDTH * 0.65], repeatRows=1, hAlign="LEFT")
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), PALE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, 0), 0.7, BORDER),
                ("LINEBELOW", (0, 1), (-1, -1), 0.35, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            output.extend([table, Spacer(1, 11)])
            continue
        if re.match(r"^\d+\. ", line):
            paragraph = line
            index += 1
            while index < len(lines) and lines[index].strip() and not re.match(r"^\d+\. ", lines[index]):
                paragraph += " " + lines[index].strip()
                index += 1
            output.append(Paragraph(inline(paragraph), style["GuideBody"]))
            continue
        paragraph = line
        index += 1
        while index < len(lines) and lines[index].strip() and not lines[index].startswith(("# ", "|", "~~~", "<!--")):
            paragraph += " " + lines[index].strip()
            index += 1
        output.append(Paragraph(inline(paragraph), style["GuideBody"]))
    return output


def build(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(
        str(destination), pagesize=A4, rightMargin=42, leftMargin=42,
        topMargin=54, bottomMargin=48, title="IOP Project State and Native Development Guide",
        author="Industrial Operations Platform", subject="Offline developer guide, 2026-10-09",
        pageCompression=1,
    )
    document.build(flowables(source.read_text()), onFirstPage=header, onLaterPages=header,
                   canvasmaker=NumberedCanvas)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path,
                        default=ROOT / "docs/development/native-development-guide.md")
    parser.add_argument("--output", type=Path,
                        default=ROOT / "output/pdf/iop-project-native-development-guide.pdf")
    arguments = parser.parse_args()
    build(arguments.source, arguments.output)
    print(f"Generated {arguments.output}")
