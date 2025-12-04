import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


class ChapterAgent:
    def __init__(self):
        # Use Groq for chapter organization (fast processing)
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"  # Use 70B for better reasoning

    def process(self, facts: list[dict], target_duration_minutes: float):
        try:
            # Extract fact texts
            fact_texts = []
            for fact_item in facts:
                if isinstance(fact_item, dict):
                    fact_texts.append(fact_item.get('fact', str(fact_item)))
                else:
                    fact_texts.append(str(fact_item))
            
            prompt = self._create_prompt(fact_texts, target_duration_minutes)
            
            print(f"📋 Creating chapters with Groq (Llama 3.1 70B)...")
            
            # Call Groq API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert podcast script organizer with precise timing control. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            # Parse JSON response
            result_text = response.choices[0].message.content.strip()
            
            # Remove any markdown code block formatting if present
            if result_text.startswith('```json'):
                result_text = result_text[7:-3]
            elif result_text.startswith('```'):
                result_text = result_text[3:-3]
                
            result = json.loads(result_text)
            chapters = result.get("chapters", [])
            
            # Validate and adjust durations if needed
            chapters = self._validate_and_adjust_durations(chapters, target_duration_minutes)
            
            print(f"✅ Created {len(chapters)} chapters with Groq")
            return chapters
            
        except Exception as e:
            print(f"Error in ChapterAgent (Groq): {e}")
            return []

    def _create_prompt(self, facts, target_duration_minutes):
        return f"""
You are an expert podcast script organizer with precise timing control.
You will organize facts into chapters that EXACTLY fit the specified duration.

CRITICAL TIMING REQUIREMENTS:
- Total target duration: {target_duration_minutes} minutes
- Account for SFX, music, and natural pauses (reduce content by 15-20%)
- Each chapter should be 2-8 minutes for good pacing
- Prioritize most important/interesting facts if time is limited
- If duration is long, expand with more detail and examples

Duration Guidelines:
- 1-3 minutes: 1-2 chapters (quick facts/overview)
- 4-8 minutes: 2-3 chapters (focused exploration)
- 9-15 minutes: 3-5 chapters (detailed coverage)
- 16+ minutes: 4-7 chapters (comprehensive deep dive)

CONTENT STRATEGY by Duration:
Short (1-5 min): Hit the most fascinating highlights only
Medium (6-15 min): Cover main points with some detail
Long (16+ min): Include background, details, examples, and implications

The fact bank contains: {facts}

Create a chapter structure that will EXACTLY fill {target_duration_minutes} minutes when spoken aloud.

IMPORTANT: The title should be clean and professional without any duration annotations.
The allocated_duration_minutes is only for internal timing calculations.

Ensure all allocated_duration_minutes add up to approximately {target_duration_minutes} minutes.

Return ONLY valid JSON in this exact format:
{{
  "chapters": [
    {{
      "title": "Compelling chapter title (NO duration)",
      "key_points": ["Point 1", "Point 2", "Point 3"],
      "allocated_duration_minutes": 3.5
    }},
    {{
      "title": "Another chapter title",
      "key_points": ["Point A", "Point B"],
      "allocated_duration_minutes": 2.5
    }}
  ]
}}
"""

    def _validate_and_adjust_durations(self, chapters, target_duration):
        """Ensure chapter durations add up to target duration"""
        if not chapters:
            return chapters
            
        total_allocated = sum(float(chapter.get('allocated_duration_minutes', 0)) for chapter in chapters)
        
        if abs(total_allocated - target_duration) > 0.5:  # If off by more than 30 seconds
            # Proportionally adjust each chapter
            adjustment_factor = target_duration / total_allocated if total_allocated > 0 else 1
            
            for chapter in chapters:
                current_duration = float(chapter.get('allocated_duration_minutes', 0))
                chapter['allocated_duration_minutes'] = round(current_duration * adjustment_factor, 1)
            
            print(f"Adjusted chapter durations from {total_allocated} to {target_duration} minutes")
        
        return chapters