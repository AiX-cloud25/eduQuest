#!/usr/bin/env python3
"""
GIF/Animation Generator for EduQuest Chapter 14 Explainers
Uses Gemini Nano Banana to generate educational explainer images
"""

import asyncio
import os
import base64
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from emergentintegrations.llm.chat import LlmChat, UserMessage

# Topics to generate
CHAPTER_14_TOPICS = [
    {
        "slug": "need-for-respiration",
        "title": "Need for Respiration",
        "prompt": "Create an educational diagram showing glucose (C6H12O6) breaking down in a cell to release energy in the form of ATP molecules. Show glucose molecule on one side, mitochondria in the middle processing it, and ATP energy symbols coming out. Use bright, kid-friendly colors with blue, green and yellow. Style should be simple, flat, and suitable for school students aged 10-16. Include simple labels."
    },
    {
        "slug": "aerobic-anaerobic",
        "title": "Aerobic vs Anaerobic Respiration",
        "prompt": "Create a split educational diagram comparing aerobic respiration (with oxygen, showing O2 molecules and lots of ATP/energy output) on the left side versus anaerobic respiration (without oxygen, showing less ATP and lactic acid formation) on the right side. Use contrasting colors - bright blue/green for aerobic side and orange/red for anaerobic side. Style should be simple, flat, and suitable for school students. Include labels."
    },
    {
        "slug": "parts-of-respiration",
        "title": "Four Parts of Respiration",
        "prompt": "Create an educational infographic showing the four parts of respiration in humans as a flow diagram: 1) Breathing (lungs icon), 2) Gaseous Transport (blood cells carrying O2), 3) Tissue Respiration (cells receiving oxygen), 4) Cellular Respiration (energy production in mitochondria). Use numbered circles connected by arrows. Bright educational colors - teal, coral, yellow. Simple flat style for school students."
    },
    {
        "slug": "respiratory-organs",
        "title": "Respiratory Organs Path",
        "prompt": "Create a colorful educational diagram showing the path of air through the human respiratory system with arrows: Nose → Pharynx → Larynx → Trachea → Bronchi → Bronchioles → Alveoli. Show a simplified front view of the respiratory system with labeled organs. Use bright, friendly colors - teal for the path, pink for lungs, labeled clearly. Suitable for students aged 10-16."
    },
    {
        "slug": "breathing-cycle",
        "title": "Breathing Cycle",
        "prompt": "Create a side-by-side educational diagram showing inhalation and exhalation. Left side: Inhalation - diaphragm moving down (contracted), ribs moving up and out, lungs expanding, arrow showing air entering. Right side: Exhalation - diaphragm moving up (relaxed), ribs moving down and in, lungs contracting, arrow showing air leaving. Use blue arrows for air flow, pink for lungs. Simple flat educational style."
    },
    {
        "slug": "lung-capacities",
        "title": "Lung Volumes and Capacities",
        "prompt": "Create a colorful bar chart or stacked diagram showing different lung volumes: Tidal Volume (500mL), Inspiratory Reserve (3000mL), Expiratory Reserve (1000mL), Residual Volume (1500mL), Vital Capacity (4500mL), Total Lung Capacity (6000mL). Use different bright colors for each segment. Include volume labels in mL. Simple educational infographic style suitable for school students."
    },
    {
        "slug": "inspired-expired-air",
        "title": "Inspired vs Expired Air",
        "prompt": "Create a comparison infographic showing composition of inspired air (left side) vs expired air (right side). Show percentages: Inspired - O2 21%, CO2 0.04%, N2 79%. Expired - O2 16%, CO2 4%, N2 79%. Use pie charts or bar graphs with different colors - blue for oxygen, gray for nitrogen, red/orange for CO2. Clear labels. Simple educational style for students."
    },
    {
        "slug": "hypoxia",
        "title": "Hypoxia - Oxygen Deficiency",
        "prompt": "Create an educational diagram showing hypoxia (oxygen deficiency). Show red blood cells traveling through blood vessels with progressively fewer oxygen molecules attached as altitude increases or in low-oxygen conditions. Include a small mountain to represent high altitude. Use red for blood cells, blue dots for oxygen, yellow warning symbols. Simple flat style suitable for school students."
    }
]

async def generate_explainer_image(topic: dict, output_dir: Path):
    """Generate an educational explainer image for a topic using Gemini Nano Banana"""
    
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print(f"ERROR: EMERGENT_LLM_KEY not found in environment")
        return False
    
    output_path = output_dir / f"{topic['slug']}.png"
    
    # Skip if already exists
    if output_path.exists():
        print(f"SKIP: {topic['slug']} - already exists")
        return True
    
    print(f"Generating: {topic['title']}...")
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"eduquest-{topic['slug']}",
            system_message="You are an educational illustration generator. Create clear, colorful, simple diagrams suitable for school students aged 10-16."
        )
        
        chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        msg = UserMessage(text=topic["prompt"])
        
        text, images = await chat.send_message_multimodal_response(msg)
        
        if images and len(images) > 0:
            # Save the first image
            image_data = images[0]
            image_bytes = base64.b64decode(image_data['data'])
            
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(image_bytes)
            
            print(f"SUCCESS: {topic['slug']} - saved to {output_path}")
            return True
        else:
            print(f"WARNING: {topic['slug']} - no image generated")
            return False
            
    except Exception as e:
        print(f"ERROR: {topic['slug']} - {str(e)[:100]}")
        return False

async def main():
    """Generate all explainer images for Chapter 14"""
    
    print("=" * 60)
    print("EduQuest Chapter 14 Explainer Generator")
    print("=" * 60)
    
    # Output directory
    output_dir = ROOT_DIR / "media" / "gifs" / "class9" / "science" / "biology" / "chapter14"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Output directory: {output_dir}")
    print(f"Topics to generate: {len(CHAPTER_14_TOPICS)}")
    print("-" * 60)
    
    success_count = 0
    
    for topic in CHAPTER_14_TOPICS:
        result = await generate_explainer_image(topic, output_dir)
        if result:
            success_count += 1
        # Small delay between requests
        await asyncio.sleep(1)
    
    print("-" * 60)
    print(f"Generation complete: {success_count}/{len(CHAPTER_14_TOPICS)} successful")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
