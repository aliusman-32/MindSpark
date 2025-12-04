from queryAgent import QueryAgent
from researchAgent import ResearchAgent
from chunkFactExtractor import ChunkFactExtractor
from chapterAgent import ChapterAgent
from scriptGenerator import ScriptGenerator
from docIndexer import DocIndexer
from langchain_core.documents import Document
import os
from dotenv import load_dotenv
import json
from datetime import datetime
import uuid
import subprocess
import sys

load_dotenv()


class PodcastPipeline:
    def __init__(self):
        self.query_agent = QueryAgent()
        self.research_agent = ResearchAgent()
        self.doc_indexer = DocIndexer()
        self.fact_extractor = ChunkFactExtractor()
        self.chapter_agent = ChapterAgent()
        self.script_generator = ScriptGenerator()

    def tavily_results_to_docs(self, results):
        """Convert Tavily results to LangChain documents"""
        docs = []
        for item in results:
            if item.get("content"):
                docs.append(
                    Document(
                        page_content=item["content"],
                        metadata={
                            "source": item["url"],
                            "title": item["title"],
                            "score": item.get("score"),
                        },
                    )
                )
        return docs

    def generate_timed_script(self, user_query: str, target_duration_minutes: float):
        """Generate script that matches the exact target duration"""
        
        print(f"🎯 Targeting {target_duration_minutes} minutes of content")
        
        print("🔍 Step 1: Generating research queries...")
        research_queries = self.query_agent.process(user_query)
        print(f"Generated {len(research_queries)} research queries")

        print("📚 Step 2: Researching topics...")
        all_results = []
        for query in research_queries:
            print(f"  Researching: {query}")
            results = self.research_agent.process(query)
            all_results.extend(results)
        
        print(f"Found {len(all_results)} research results")

        print("📝 Step 3: Indexing documents...")
        docs = self.tavily_results_to_docs(all_results)
        self.doc_indexer.indexDocs(docs)

        print("🔎 Step 4: Extracting relevant facts...")
        relevant_chunks = self.doc_indexer.retrieve(user_query)
        fact_bank = self.fact_extractor.process_chunks(relevant_chunks)
        print(f"Extracted {len(fact_bank)} facts")

        print(f"📖 Step 5: Creating chapters for {target_duration_minutes} minutes...")
        chapters = self.chapter_agent.process(fact_bank, target_duration_minutes)
        print(f"Created {len(chapters)} chapters")

        print("🎙️ Step 6: Generating precisely-timed script...")
        final_output = self.script_generator.process(chapters, target_duration_minutes)
        
        # Calculate accuracy
        duration_accuracy = abs(final_output['estimated_speaking_time'] - target_duration_minutes)
        accuracy_percentage = max(0, (1 - duration_accuracy / target_duration_minutes) * 100)
        
        print(f"✅ Generated script: {final_output['estimated_speaking_time']:.1f} minutes")
        print(f"🎯 Target accuracy: {accuracy_percentage:.1f}%")
        
        return {
            "original_query": user_query,
            "target_duration_minutes": target_duration_minutes,
            "actual_duration_minutes": final_output['estimated_speaking_time'],
            "duration_accuracy_minutes": duration_accuracy,
            "accuracy_percentage": accuracy_percentage,
            "research_queries": research_queries,
            "fact_count": len(fact_bank),
            "chapters": chapters,
            "script": final_output["script"],
            "word_count": final_output["word_count"],
            "target_word_count": final_output["target_word_count"],
            "timestamp": datetime.now().isoformat()
        }

    def save_timed_output(self, output, unique_id=None):
        """Save the generated script with timing information and a unique ID"""
        if not unique_id:
            unique_id = str(uuid.uuid4())[:8]  # Generate a short unique ID
        
        # Create directories if they don't exist
        os.makedirs("Scripts", exist_ok=True)
        os.makedirs("audios", exist_ok=True)
        
        # Save script to Scripts folder with unique ID
        script_filename = f"Scripts/{unique_id}.txt"
        with open(script_filename, 'w', encoding='utf-8') as f:
            f.write(output['script'])
        
        # Save detailed metadata
        metadata_filename = f"Scripts/{unique_id}_metadata.json"
        with open(metadata_filename, 'w') as f:
            json.dump(output, f, indent=2)
        
        print(f"✅ Script saved with ID: {unique_id}")
        return unique_id, script_filename, metadata_filename

    def generate_audio(self, unique_id):
        """Generate audio from the script with the given unique ID"""
        script_path = f"Scripts/{unique_id}.txt"
        output_path = f"audios/{unique_id}.wav"
        
        if not os.path.exists(script_path):
            print(f"❌ Script file not found: {script_path}")
            return None
        
        try:
            print(f"🔊 Generating audio for script ID: {unique_id}")
            
            # Copy script to the location expected by audioGenerator.py
            with open(script_path, 'r', encoding='utf-8') as src_file:
                script_content = src_file.read()
            
            with open("script.txt", 'w', encoding='utf-8') as dest_file:
                dest_file.write(script_content)
            
            # Run the audio generator script with the script ID
            result = subprocess.run([sys.executable, "audioGenerator.py", "--script_id", unique_id], 
                                   capture_output=True, 
                                   text=True)
            
            # Check if the audio was generated directly to the audios folder
            if os.path.exists(output_path):
                print(f"✅ Audio saved to: {output_path}")
                return output_path
            # Fallback: check if it was saved as final_mix.wav
            elif os.path.exists("final_mix.wav"):
                os.rename("final_mix.wav", output_path)
                print(f"✅ Audio moved to: {output_path}")
                return output_path
            else:
                print(f"❌ Audio generation failed: {result.stderr}")
                return None
        except Exception as e:
            print(f"❌ Error generating audio: {e}")
            return None
    
    def get_duration_suggestions(self, user_query: str):
        """Get suggested durations based on query complexity"""
        word_count = len(user_query.split())
        complexity_keywords = ['how', 'why', 'explain', 'mechanism', 'process', 'detailed', 'comprehensive']
        complexity_score = sum(1 for word in complexity_keywords if word.lower() in user_query.lower())
        
        if word_count <= 3 and complexity_score == 0:
            return {
                "quick": 2,
                "standard": 5,
                "detailed": 8,
                "comprehensive": 12
            }
        elif word_count <= 6 or complexity_score <= 2:
            return {
                "quick": 3,
                "standard": 7,
                "detailed": 12,
                "comprehensive": 18
            }
        else:
            return {
                "quick": 5,
                "standard": 10,
                "detailed": 18,
                "comprehensive": 25
            }


# Usage Examples
# if __name__ == "__main__":
#     pipeline = PodcastPipeline()
    
#     # Example 1: Generate a 5-minute script
#     user_query = "how do rockets work"
#     target_duration = 5.0
    
#     print("🚀 Starting Duration-Controlled Podcast Generation...")
#     result = pipeline.generate_timed_script(user_query, target_duration)
    
#     # Save the output with a unique ID
#     unique_id, script_file, metadata_file = pipeline.save_timed_output(result)
    
#     print(f"\n✅ Generated {result['actual_duration_minutes']:.1f} minute script")
#     print(f"🎯 Accuracy: {result['accuracy_percentage']:.1f}%")
#     print(f"📄 Script saved to: {script_file}")
    
#     # Generate audio from the script
#     audio_path = pipeline.generate_audio(unique_id)
#     if audio_path:
#         print(f"🔊 Audio generated at: {audio_path}")
    
#     # Example 2: Get duration suggestions
#     suggestions = pipeline.get_duration_suggestions(user_query)
#     print(f"\n💡 Duration suggestions for '{user_query}':")
#     for key, duration in suggestions.items():
#         print(f"  {key.title()}: {duration} minutes")