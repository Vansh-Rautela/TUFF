"""
TUFFY - AI Style Advisor powered by Google Gemini
Your personal fashion deity ready to help with style!
"""

import os
import google.generativeai as genai
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class TuffyStyleAdvisor:
    """
    TUFFY - The all-knowing Style God
    Powered by Google Gemini for personalized fashion advice
    """
    
    def __init__(self):
        # Configure Gemini API
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        
        # Use Gemini 2.5 Flash
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # TUFFY's personality and expertise
        self.system_prompt = """You are TUFFY, an all-knowing Fashion God and Style Deity. 
You are the ultimate authority on fashion, style, and personal expression.

YOUR PERSONALITY:
- Wise, warm, and encouraging like a benevolent deity
- Confident and authoritative about fashion knowledge
- Supportive and never judgmental
- Use emojis occasionally for divine flair ✨
- Sometimes reference your "divine vision" or "fashion wisdom"
- Speak in a friendly yet sophisticated tone

YOUR EXPERTISE:
- Color theory and seasonal color analysis
- Body type styling and silhouettes
- Current fashion trends
- Mixing and matching outfits
- Occasion-appropriate dressing
- Building capsule wardrobes
- Sustainable fashion
- Cultural fashion sensitivity

RESPONSE STYLE:
- Keep responses concise (2-4 sentences usually)
- Be specific and actionable
- Use the user's name if provided
- Reference their color analysis when relevant
- Give reasoning for recommendations
- End with an empowering note

SHOPPING REQUESTS:
- If user asks to see/buy products, ask: "Which brand do you prefer?" 
- Mention available brands: Myntra, Flipkart, Amazon.
- NEVER say you cannot show products. Instead, ask for the brand preference.
- Once they pick a brand, I will show them the products.

Remember: You're here to help mortals achieve style enlightenment! 🌟
"""
        
        # Chat history storage (in production, use database)
        self.chat_sessions = {}
    
    def _build_context_prompt(self, user_data: Dict[str, Any]) -> str:
        """Build context from user's profile"""
        context_parts = ["USER PROFILE:\n"]
        
        # Color analysis
        if user_data.get('colorAnalysis'):
            color = user_data['colorAnalysis']
            skintone = color.get('skintone', {})
            context_parts.append(
                f"- Skin Undertone: {skintone.get('undertone', 'Unknown')}\n"
                f"- Seasonal Type: {skintone.get('season', 'Unknown')}\n"
                f"- Best Colors: {', '.join([c.get('name', '') for c in color.get('complementaryColors', [])])}\n"
            )
        
        # Gender and physique
        if user_data.get('gender'):
            context_parts.append(f"- Gender: {user_data['gender']}\n")
        if user_data.get('physique'):
            context_parts.append(f"- Body Type: {user_data['physique']}\n")
        
        # Favorite styles
        if user_data.get('favoriteStyles'):
            context_parts.append(f"- Favorite Styles: {', '.join(user_data['favoriteStyles'])}\n")
        
        # Current products looking at
        if user_data.get('currentProducts'):
            products = user_data['currentProducts'][:3]  # First 3 products
            context_parts.append(f"\nPRODUCTS USER IS VIEWING:\n")
            for p in products:
                context_parts.append(f"- {p.get('title', 'Product')} ({p.get('brand', 'Brand')})\n")
        
        return ''.join(context_parts)
    
    def get_chat_response(
        self,
        user_id: str,
        message: str,
        user_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Get TUFFY's response to user's question
        
        Args:
            user_id: Unique user identifier
            message: User's message
            user_data: User profile data for context
            
        Returns:
            Dict with response and metadata
        """
        try:
            # Initialize chat session for user if not exists
            if user_id not in self.chat_sessions:
                # Build context-aware system prompt
                context = ""
                if user_data:
                    context = self._build_context_prompt(user_data)
                
                full_prompt = f"{self.system_prompt}\n\n{context}\n\nNow respond to the user's questions with divine fashion wisdom!"
                
                # Start new chat with context
                self.chat_sessions[user_id] = {
                    'chat': self.model.start_chat(history=[]),
                    'context': context,
                    'message_count': 0
                }
                
                # Send system prompt (won't be shown to user)
                self.chat_sessions[user_id]['chat'].send_message(full_prompt)
            
            # Get chat session
            session = self.chat_sessions[user_id]
            chat = session['chat']
            
            # Generate response
            response = chat.send_message(message)
            session['message_count'] += 1
            
            return {
                'success': True,
                'response': response.text,
                'message_count': session['message_count'],
                'tuffy_says': response.text  # Friendly key name
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'tuffy_says': "✨ My divine powers are temporarily unavailable. Please try again in a moment!"
            }
    
    def get_style_tip(self, user_data: Dict[str, Any]) -> str:
        """Get a quick style tip based on user profile"""
        try:
            context = self._build_context_prompt(user_data)
            
            prompt = f"""Based on this user profile, give ONE quick, actionable style tip.
            
{context}

Give a specific tip in 1-2 sentences. Be encouraging and divine! ✨"""
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return "✨ Trust your instincts - you have great style potential within you!"
    
    def analyze_outfit(self, items: List[Dict[str, Any]], user_data: Dict[str, Any]) -> str:
        """Analyze if outfit items work well together"""
        try:
            context = self._build_context_prompt(user_data)
            
            items_desc = "\n".join([
                f"- {item.get('title', 'Item')} ({item.get('brand', 'Brand')})"
                for item in items
            ])
            
            prompt = f"""As TUFFY, the Fashion God, analyze this outfit combination:

{items_desc}

User Profile:
{context}

In 2-3 sentences, tell if these items work together and why. Be specific about colors, styles, and the user's profile. ✨"""
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return "✨ These pieces each have their own charm! Mix and match to discover your divine style."
    
    def suggest_occasion_outfit(self, occasion: str, user_data: Dict[str, Any], available_products: List[Dict]) -> str:
        """Suggest outfit for specific occasion"""
        try:
            context = self._build_context_prompt(user_data)
            
            products_desc = "\n".join([
                f"- {p.get('title', 'Product')} - {p.get('price', 'Price')} ({p.get('brand', 'Brand')})"
                for p in available_products[:10]
            ])
            
            prompt = f"""As TUFFY, the Fashion God, suggest an outfit for this occasion: {occasion}

User Profile:
{context}

Available Products:
{products_desc}

Suggest 2-3 items that would work together. Be specific and reference the actual products. Keep it under 100 words. ✨"""
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"✨ For {occasion}, trust your divine intuition! Choose pieces that make you feel confident."
    
    def clear_chat_history(self, user_id: str):
        """Clear chat history for user"""
        if user_id in self.chat_sessions:
            del self.chat_sessions[user_id]


# Global instance
_tuffy_instance = None

def get_tuffy() -> TuffyStyleAdvisor:
    """Get or create global TUFFY instance"""
    global _tuffy_instance
    if _tuffy_instance is None:
        _tuffy_instance = TuffyStyleAdvisor()
    return _tuffy_instance
