from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape
from reportlab.lib.units import inch
from reportlab.lib import colors
import os
import glob
from PIL import Image

# Configuration
PAGE_WIDTH = 16 * inch
PAGE_HEIGHT = 9 * inch
PDF_PATH = "/home/siddhartha/.gemini/antigravity/brain/fee277e2-106e-40dd-b6c1-9e92c8cb70af/AyuLink_Pitch_Deck.pdf"
SCREENSHOT_DIR = "/home/siddhartha/.gemini/antigravity/brain/fee277e2-106e-40dd-b6c1-9e92c8cb70af"

# Colors
PRIMARY_COLOR = colors.HexColor("#0d9488") # Teal
SECONDARY_COLOR = colors.HexColor("#0f172a") # Dark Slate
TEXT_COLOR = colors.HexColor("#334155") # Slate 700

def get_latest_screenshot(pattern):
    files = glob.glob(os.path.join(SCREENSHOT_DIR, pattern))
    if not files:
        return None
    return max(files, key=os.path.getctime)

def create_slide(c, title, subtitle=None, image_path=None, bullet_points=None):
    # Background
    c.setFillColor(colors.white)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1)
    
    # Title Bar
    # c.setFillColor(PRIMARY_COLOR)
    # c.rect(0, PAGE_HEIGHT - 1.5*inch, PAGE_WIDTH, 1.5*inch, fill=1, stroke=0)
    
    # Title Text
    c.setFillColor(SECONDARY_COLOR)
    c.setFont("Helvetica-Bold", 48)
    c.drawString(1*inch, PAGE_HEIGHT - 1.2*inch, title)
    
    # Subtitle
    if subtitle:
        c.setFillColor(PRIMARY_COLOR)
        c.setFont("Helvetica", 24)
        c.drawString(1*inch, PAGE_HEIGHT - 1.8*inch, subtitle)
        
    # Content Area
    y_position = PAGE_HEIGHT - 2.5*inch
    
    if bullet_points:
        c.setFillColor(TEXT_COLOR)
        c.setFont("Helvetica", 28)
        for point in bullet_points:
            c.drawString(1.5*inch, y_position, f"• {point}")
            y_position -= 0.8*inch
            
    if image_path and os.path.exists(image_path):
        # Calc image details
        try:
            img = Image.open(image_path)
            img_w, img_h = img.size
            aspect = img_h / float(img_w)
            
            # Target width: 14 inches (1 inch margins)
            target_w = 12 * inch
            target_h = target_w * aspect
            
            # Check if height is too tall
            max_h = y_position - 0.5*inch # Leave room at bottom
            if target_h > max_h:
                target_h = max_h
                target_w = target_h / aspect
                
            # Center image
            x_pos = (PAGE_WIDTH - target_w) / 2
            y_pos = (PAGE_HEIGHT - target_h) / 2 - 0.5*inch # Center vertically slightly lower
            
            c.drawImage(image_path, x_pos, y_pos, width=target_w, height=target_h, preserveAspectRatio=True)
        except Exception as e:
            print(f"Error loading image {image_path}: {e}")

    c.showPage()

def create_cover(c):
    c.setFillColor(SECONDARY_COLOR)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 80)
    c.drawCentredString(PAGE_WIDTH/2, PAGE_HEIGHT/2 + 0.5*inch, "AyuLink")
    
    c.setFont("Helvetica", 32)
    c.setFillColor(colors.HexColor("#2dd4bf")) # Lighter Teal
    c.drawCentredString(PAGE_WIDTH/2, PAGE_HEIGHT/2 - 0.5*inch, "Smart Health. Zero Boundaries.")
    
    c.setFont("Helvetica", 20)
    c.setFillColor(colors.gray)
    c.drawCentredString(PAGE_WIDTH/2, 1*inch, "Pitch Deck 2026")
    
    c.showPage()

def generate_pdf():
    c = canvas.Canvas(PDF_PATH, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    
    # 1. Cover
    create_cover(c)
    
    # 2. Problem
    create_slide(c, "The Problem", "Rural Healthcare Gap", bullet_points=[
        "Limited access to specialists in remote villages",
        "Delayed diagnosis of critical conditions",
        "Lack of continuous monitoring for chronic patients",
        "Disconnected healthcare records"
    ])
    
    # 3. Solution Ecosystem
    create_slide(c, "The Solution", "A Comprehensive IoT Ecosystem", bullet_points=[
        "Smart Wristbands for Real-time Vitals (HR, SpO2)",
        "Automated Medicine Dispensers for Adherence",
        "LoRaWAN Mesh Network for Offline Connectivity",
        "AI-Powered Analytics & Cloud Dashboard"
    ])
    
    # 4. Command Center
    img = get_latest_screenshot("command_center*.png")
    create_slide(c, "Command Center", "District-Level Geo-Orchestration", image_path=img)

    # 5. Dashboard
    img = get_latest_screenshot("dashboard*.png")
    create_slide(c, "Live Dashboard", "Real-time Telemetry & Alerts", image_path=img)
    
    # 6. Patient Registry
    img = get_latest_screenshot("patients*.png")
    create_slide(c, "Patient Registry", "Comprehensive Health Records", image_path=img)
    
    # 7. Device Management
    img = get_latest_screenshot("devices*.png")
    create_slide(c, "Device Infrastructure", "IoT Fleet Management", image_path=img)
    
    # 8. Analytics
    img = get_latest_screenshot("reports*.png")
    create_slide(c, "Health Intelligence", "AI-Driven Insights & Reports", image_path=img)
    
    # 9. Multilingual Support
    img = get_latest_screenshot("notifications*.png")
    create_slide(c, "Inclusive Design", "Multilingual Alerts & Notifications", image_path=img)
    
    # 10. Family Access
    img = get_latest_screenshot("family_login*.png")
    create_slide(c, "Family Connection", "Remote Monitoring for Loved Ones", image_path=img)
    
    # 11. Closing
    c.setFillColor(SECONDARY_COLOR)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 60)
    c.drawCentredString(PAGE_WIDTH/2, PAGE_HEIGHT/2, "Thank You")
    c.setFont("Helvetica", 24)
    c.drawCentredString(PAGE_WIDTH/2, PAGE_HEIGHT/2 - 1*inch, "ayulink.health")
    c.showPage()
    
    c.save()
    print(f"PDF Generated at {PDF_PATH}")

if __name__ == "__main__":
    generate_pdf()
