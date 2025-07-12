import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
async function callGeminiAPI(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API response:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  const data = await response.json();
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
    console.error('Unexpected Gemini API response structure:', JSON.stringify(data));
    throw new Error('Invalid response structure from Gemini API');
  }
  return data.candidates[0].content.parts[0].text;
}
serve(async (req)=>{
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  try {
    const { evaluation_context, user_diagram_json } = await req.json();
    // Debug logging
    console.log('Received request with evaluation_context:', JSON.stringify(evaluation_context, null, 2));
    console.log('GEMINI_API_KEY exists:', !!GEMINI_API_KEY);
    // Extract information from evaluation context
    const problem_title = evaluation_context.problem.title;
    const problem_description = evaluation_context.problem.description;
    const current_level = evaluation_context.currentLevel;
    const all_levels = evaluation_context.allLevels;
    const user_level = evaluation_context.userLevel;
    // Build comprehensive requirements text
    let requirements_text = `Problem: ${problem_title}\n\n`;
    requirements_text += `Problem Description: ${problem_description}\n\n`;
    requirements_text += `Current Level: ${current_level.number}\n`;
    requirements_text += `Current Level Requirements: ${current_level.description}\n`;
    requirements_text += `Current Level Evaluation Criteria: ${JSON.stringify(current_level.criteria)}\n\n`;
    // Add all previous levels' requirements
    requirements_text += "All Level Requirements:\n";
    for (const level of all_levels){
      requirements_text += `Level ${level.number}: ${level.description}\n`;
      requirements_text += `Level ${level.number} Criteria: ${JSON.stringify(level.criteria)}\n\n`;
    }
    const prompt = `You are a strict and unforgiving software architect evaluating a low-level design solution. Be harsh but fair.

CONTEXT:
The user is working on Level ${user_level} of a multi-level problem. Their design should address ALL requirements from Level 1 through Level ${user_level}.

PROBLEM AND REQUIREMENTS:
${requirements_text}

USER'S DESIGN:
The user has submitted a diagram represented by this JSON: ${JSON.stringify(user_diagram_json)}

EVALUATION INSTRUCTIONS:
1. Be EXTREMELY strict with scoring. A basic box with just a label should get 0-10 points.
2. Evaluate how well the design addresses ALL requirements from Level 1 through Level ${user_level}
3. Check adherence to SOLID principles
4. Assess appropriate use of design patterns
5. Consider scalability and maintainability
6. Evaluate the overall architectural quality

SCORING GUIDELINES:
- 0-10: Just a basic box/diagram with no real design
- 10-25: Very basic entities, missing most requirements
- 25-40: Some entities but poor relationships/design
- 40-60: Basic design with some relationships
- 60-75: Good design with proper entities and relationships
- 75-85: Excellent design with good patterns
- 85-100: Outstanding design with all requirements met

FEEDBACK GUIDELINES:
- Be concise and direct
- Don't give away the full solution
- Point out what's missing or wrong
- If the design is terrible, feel free to roast/troll them (but constructively)
- Focus on what they need to improve
- Keep feedback under 200 words

IMPORTANT: The design should be comprehensive enough to handle ALL previous levels' requirements, not just the current level.

Return a JSON object with exactly these keys:
- "score": integer from 0 to 100 (be strict!)
- "feedback": string with concise, direct feedback (max 200 words)

Example response format:
{"score": 15, "feedback": "This is barely a design. You've drawn a box and called it a day. Where are the actual entities? The relationships? The attributes? This wouldn't even pass a basic design review."}`;
    // Call Gemini API
    const geminiResponse = await callGeminiAPI(prompt);
    // Try to parse the response as JSON
    let result;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = geminiResponse;
      // Remove markdown code blocks
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/g, '');
      }
      // Trim whitespace
      cleanResponse = cleanResponse.trim();
      console.log('Cleaned response:', cleanResponse);
      result = JSON.parse(cleanResponse);
      // Validate the parsed result has required fields
      if (typeof result.score !== 'number' || typeof result.feedback !== 'string') {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response structure');
      }
      console.log('Successfully parsed result:', result);
    } catch (error) {
      console.error('JSON parsing error:', error);
      console.error('Original response:', geminiResponse);
      // Try to extract JSON from the response using regex
      const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0]);
          if (typeof extractedJson.score === 'number' && typeof extractedJson.feedback === 'string') {
            result = extractedJson;
            console.log('Successfully extracted JSON:', result);
          } else {
            throw new Error('Extracted JSON has invalid structure');
          }
        } catch (extractError) {
          console.error('Failed to extract JSON:', extractError);
          // If response is not valid JSON, return a default structure
          result = {
            score: 50,
            feedback: `Evaluation completed. Raw response: ${geminiResponse}`
          };
        }
      } else {
        // If response is not valid JSON, return a default structure
        result = {
          score: 50,
          feedback: `Evaluation completed. Raw response: ${geminiResponse}`
        };
      }
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error in judge-design function:', error);
    return new Response(JSON.stringify({
      score: 0,
      feedback: `Error evaluating design: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
});
