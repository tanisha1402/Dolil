"""Regenerates synthetic test PDFs. All content is invented; no real records. Needs reportlab and GNU FreeSerif (has Bengali glyphs)."""
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pdfencrypt import StandardEncryption

pdfmetrics.registerFont(TTFont("FreeSerif", "/usr/share/fonts/truetype/freefont/FreeSerif.ttf"))
LINES = [
    "বিক্রয় দলিল (কাল্পনিক নমুনা)",
    "বিক্রেতা: আব্দুল করিম",
    "ক্রেতা: রফিক আহমেদ",
    "দাগ নম্বর: ১২৪৫",
    "খতিয়ান নম্বর: ৩৮৯",
    "জমির পরিমাণ: ১০ শতাংশ",
]
c = canvas.Canvas("fixtures/bangla.pdf")
c.setFont("FreeSerif", 16)
y = 780
for line in LINES:
    c.drawString(60, y, line); y -= 28
c.save()

enc = StandardEncryption("userpw", ownerPassword="ownerpw", canPrint=1)
c = canvas.Canvas("fixtures/encrypted.pdf", encrypt=enc)
c.setFont("Helvetica", 14); c.drawString(60, 780, "Synthetic encrypted sample document with enough text."); c.save()
print("ok")
