import os
import re
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class ScriptOutput(BaseModel):
    script: str = Field(description="Complete podcast script with clean chapter titles, engaging narration, and strategic SFX placement")
    word_count: int = Field(description="Total word count of the script")
    estimated_speaking_time: float = Field(description="Estimated speaking time in minutes based on word count")


class ScriptGenerator:
    def __init__(self):
        print("🎭 Initializing ScriptGenerator with Gemini (for creative writing)...")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.7
        )

        self.words_per_minute = 155
        self.sfx_time_buffer = 0.15

        self.outputParser = PydanticOutputParser(pydantic_object=ScriptOutput)

        self.promptTemplate = PromptTemplate(
            template="""
            You are an expert podcast script writer with PRECISE TIMING CONTROL and immersive storytelling skills.
            Write a script that will take EXACTLY {target_duration_minutes} minutes to speak aloud.

            OBJECTIVE
            - Create an engaging, entertaining, and energetic spoken-word script — as if a top podcast host is performing live.
            - Deliver information through storytelling, curiosity, and personality (not a lecture).
            - Use SFX cues and [PAUSE] deliberately to dramatize, surprise, or amuse.

            HARD TIMING RULES (follow exactly)
            - Target duration: {target_duration_minutes} minutes
            - Target word count: approx. {target_word_count} words
            - If the narration as written would be too short, extend naturally; if too long, tighten wording. Do NOT return a shorter script.
            - Speaking pace for planning: ~155 words per minute (conversational)
            - Count every [PAUSE] and every [SFX: ...] when estimating duration (see pause/SFX durations below).


            PAUSES & SFX (timing rules)
            - Treat each [PAUSE] as ~0.5–1.5 seconds for planning unless explicit duration metadata is provided.
            - SFX should include an implied duration in the cue when needed (e.g., "[SFX: short 1s cymbal crash]" or "[SFX: slow 5s fade-out music]").
            - Include [PAUSE] tokens where a human speaker would breathe, hesitate, or emphasize.
            - Place a [PAUSE] at the **start** of each chapter's narration to simulate the pause a speaker would take after an (implicit) chapter.

            WRITING GUIDELINES
            - Write as if performing live: energy, warmth, rhythm, contractions, rhetorical questions.
            - Avoid info-dumping: embed facts inside scenes, analogies, or curiosity→reveal→reaction segments.
            - Vary tone and pacing: humor, suspense, surprise, reflection.
            - Use SFX sparingly and purposefully to enhance the narrative.

            INTRO (first 1–2 paragraphs)
            - Start with a vivid hook: scenario, surprising fact, or playful question.
            - Use at least one [PAUSE] and one [SFX: ...] in the opening section.
            - Pause after the hook, then deliver context. Keep the opening lean and attention-grabbing.

            CLOSING (last 1–2 paragraphs)
            - End with a clear takeaway, reflection, or call-to-action.
            - Keep energy high until the final line.
            - Optionally finish with a final [PAUSE] or short [SFX: ...] fade-out cue.

            SFX RULES (STRICT — follow verbatim)
            1. Do not add any SFX unless the narration implies a sound or the script requests music/effect.
            2. Anchor every SFX to the narration: the SFX must be in the same sentence or the immediate next sentence that mentions or implies the sound source.
            3. Be detailed and descriptive: each SFX must describe the sound quality, source, and (if relevant) duration or intensity so another LLM or audio engineer could recreate it.
            - Example: prefer "[SFX: A deep, echoing explosion with debris scattering and a low rumble fading out]" over "[SFX: explosion]".
            4. Describe physical sound attributes (volume, texture, length), not emotional labels alone.
            5. Density cap: aim for ~2–3 SFX per minute unless the scene clearly requires more.
            6. If unsure whether to add an SFX, omit it.

            SCRIPT FORMAT: 
            - Narration = plain text 
            - Pauses = **[PAUSE]** 
            - Sound cues = **[SFX: ...]**

            CALCULATIONS / TIMING CONSIDERATIONS
            - Include SFX and [PAUSE] durations when computing "estimated_speaking_time_minutes".
            - Use ~155 wpm as baseline; adjust for added pause/SFX time accordingly.
            - If you include explicit durations inside SFX or PAUSE metadata, respect those values in the time calculation.

            FINAL INSTRUCTIONS
            - Keep the script entertaining start-to-finish: strong hook, dynamic middle, satisfying close.
            - Insert a [PAUSE] at the **start** of every chapter's narration (this stands in for the pause that would follow a chapter heading — do not print the heading itself).
            - DO NOT ADD ANY CHAPTER HEADINGS OR CHAPTER TITLES TO THE SCRIPT.
            - SFX must be descriptive, anchored, and sparse.
            - Add both an Introduction and a Closing chapter.
            - Make sure the script follows the time given in the target_duration_minutes.
            - Do NOT use Roman numerals anywhere in the script.

            Chapters:
                {chapters}

            {format_instructions}
            """,
            input_variables=["target_duration_minutes", "target_word_count", "chapters", "chapter_word_breakdown"],
            partial_variables={
                "format_instructions": self.outputParser.get_format_instructions()
            },
        )

    def calculate_target_word_count(self, target_duration_minutes: float) -> int:
        """Calculate target word count based on duration"""
        effective_speaking_time = target_duration_minutes * (1 - self.sfx_time_buffer)
        return int(effective_speaking_time * self.words_per_minute)

    def create_chapter_word_breakdown(self, chapters, target_word_count):
        """Create word count targets for each chapter"""
        breakdown = []
        total_allocated_time = sum(float(ch.get('allocated_duration_minutes', 0)) for ch in chapters)
        
        for chapter in chapters:
            chapter_duration = float(chapter.get('allocated_duration_minutes', 0))
            chapter_word_target = int((chapter_duration / total_allocated_time) * target_word_count)
            breakdown.append(f"- {chapter.get('title', 'Chapter')}: ~{chapter_word_target} words ({chapter_duration} minutes)")
        
        return "\n".join(breakdown)

    def count_words(self, text: str) -> int:
        """Count words in text, excluding SFX cues"""
        clean_text = re.sub(r'\*\*\[.*?\]\*\*', '', text)
        clean_text = re.sub(r'[#*>-]', '', clean_text)
        words = clean_text.split()
        return len([word for word in words if word.strip()])

    def estimate_speaking_time(self, word_count: int) -> float:
        """Estimate speaking time based on word count"""
        base_time = word_count / self.words_per_minute
        return base_time / (1 - self.sfx_time_buffer)

    def process(self, chapters: list[dict], target_duration_minutes: float):
        try:
            print(f"🎙️ Generating final script with Gemini (target: {target_duration_minutes} min)...")
            
            target_word_count = self.calculate_target_word_count(target_duration_minutes)
            chapter_breakdown = self.create_chapter_word_breakdown(chapters, target_word_count)
            
            chain = self.promptTemplate | self.llm
            response = chain.invoke({
                "target_duration_minutes": target_duration_minutes,
                "target_word_count": target_word_count,
                "chapters": chapters,
                "chapter_word_breakdown": chapter_breakdown
            })

            print('response', response)

            # Primary parse via structured parser
            script = ""
            try:
                result = self.outputParser.parse(response.content)
                script = result.script
                parsed_word_count = result.word_count
                parsed_speaking_time = result.estimated_speaking_time
            except Exception as parse_err:
                print(f"⚠️ Standard parsing failed – attempting fallback. Details: {parse_err}")
                raw_content = response.content if hasattr(response, 'content') else str(response)
                script = self._fallback_extract_script(raw_content)

            # Ensure the final script is clean
            script = self._clean_script(script)
            
            # Calculate actual metrics
            actual_word_count = self.count_words(script)
            estimated_time = self.estimate_speaking_time(actual_word_count)
            
            print(f"✅ Generated {actual_word_count} words (target: {target_word_count})")
            print(f"⏱️ Estimated time: {estimated_time:.1f} minutes")
            
            return {
                "script": script,
                "word_count": actual_word_count,
                "estimated_speaking_time": estimated_time,
                "target_word_count": target_word_count,
                "target_duration": target_duration_minutes,
                "duration_accuracy": abs(estimated_time - target_duration_minutes)
            }
            
        except Exception as e:
            print(f"Error in ScriptGenerator (Gemini): {e}")
            return {
                "script": "",
                "word_count": 0,
                "estimated_speaking_time": 0,
                "target_word_count": 0,
                "target_duration": target_duration_minutes,
                "duration_accuracy": 999
            }

    def _strip_code_fences(self, text: str) -> str:
        """Remove surrounding triple backtick code fences if present."""
        if text is None:
            return ""
        stripped = text.strip()
        code_fence_pattern = r"^```[a-zA-Z0-9_-]*\s*\n(.*?)\n```$"
        match = re.match(code_fence_pattern, stripped, re.DOTALL)
        if match:
            return match.group(1).strip()
        return stripped

    def _fallback_extract_script(self, content: str) -> str:
        """Best-effort extraction when the model returns imperfectly formatted output."""
        if not content:
            return ""

        cleaned = self._strip_code_fences(content)

        # Attempt 1: direct JSON
        try:
            obj = json.loads(cleaned)
            if isinstance(obj, dict) and "script" in obj:
                return str(obj.get("script", ""))
        except Exception:
            pass

        # Attempt 2: regex between script and word_count
        try:
            match = re.search(r'"script"\s*:\s*(.*?)(?:,\s*"word_count"|\}\s*$)', cleaned, re.DOTALL)
            if match:
                candidate = match.group(1).strip()
                if len(candidate) >= 2 and candidate[0] == '"' and candidate[-1] == '"':
                    candidate = candidate[1:-1]
                    candidate = candidate.replace(r"\n", "\n").replace(r"\t", "\t").replace(r"\"", '"')
                return candidate
        except Exception:
            pass

        # Attempt 3: extract first fenced block
        fences = re.findall(r"```[a-zA-Z0-9_-]*\s*\n(.*?)\n```", content, re.DOTALL)
        if fences:
            return fences[0].strip()

        return cleaned.strip()

    def _clean_script(self, text: str) -> str:
        """Remove code fences, JSON scaffolding, enclosing quotes, and trim whitespace."""
        if text is None:
            return ""
        cleaned = text.strip()

        cleaned = self._strip_code_fences(cleaned)

        if len(cleaned) >= 2 and cleaned[0] == '"' and cleaned[-1] == '"':
            cleaned = cleaned[1:-1]

        cleaned = cleaned.strip()
        if cleaned.startswith('{') and '}' not in cleaned:
            cleaned = cleaned.lstrip('{').strip()
        if cleaned.endswith('}') and '{' not in cleaned:
            cleaned = cleaned.rstrip('}').strip()

        return cleaned.strip()