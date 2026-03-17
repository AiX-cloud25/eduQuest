#!/usr/bin/env python3
"""
PDF Image Extractor for Chapter 14
Extracts all images/figures from the PDF and saves them with proper naming
"""

import fitz  # PyMuPDF
import os
import requests
from pathlib import Path

PDF_URL = "https://customer-assets.emergentagent.com/job_3b70d1cf-79fc-45d4-b54c-858170a40168/artifacts/zqvf9vw9_icse-class-9-biology-chapter-14-the-respiratory-system.pdf"
OUTPUT_DIR = Path("/app/backend/media/images/class9/science/biology/chapter14")

def extract_images():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Download PDF
    print("Downloading PDF...")
    response = requests.get(PDF_URL)
    pdf_path = "/tmp/chapter14.pdf"
    with open(pdf_path, "wb") as f:
        f.write(response.content)
    
    # Open PDF
    doc = fitz.open(pdf_path)
    
    image_count = 0
    image_info = []
    
    print(f"Processing {len(doc)} pages...")
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        images = page.get_images(full=True)
        
        for img_idx, img in enumerate(images):
            xref = img[0]
            
            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                # Skip very small images (likely icons/bullets)
                if len(image_bytes) < 5000:
                    continue
                
                image_count += 1
                filename = f"fig-{image_count:02d}.{image_ext}"
                filepath = OUTPUT_DIR / filename
                
                with open(filepath, "wb") as f:
                    f.write(image_bytes)
                
                image_info.append({
                    "filename": filename,
                    "page": page_num + 1,
                    "size": len(image_bytes)
                })
                
                print(f"  Extracted: {filename} (page {page_num + 1}, {len(image_bytes)} bytes)")
                
            except Exception as e:
                print(f"  Error extracting image: {e}")
    
    doc.close()
    
    print(f"\nTotal images extracted: {image_count}")
    return image_info

if __name__ == "__main__":
    extract_images()
