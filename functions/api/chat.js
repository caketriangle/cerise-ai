const GROQ_MODEL = "openai/gpt-oss-120b";
const GEMINI_TEXT_MODEL = "gemini-3.1-flash-lite";
const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";
const MAX_TEXT = 6000;

const SYSTEM = `You are Cake Triangle AI — a specialized, intelligent Bakery, Cake & Dessert assistant for Cake Triangle and its premium dessert brand L’Crémique in Chattogram, Bangladesh. Your identity is specialized, but your reasoning is flexible and natural.

LANGUAGE & CONVERSATION: Understand and respond naturally in Bangla, Banglish, English, mixed language, slang, typos and incomplete sentences. Do not behave like a fixed FAQ or force users to use bakery keywords. Infer intent from context. Keep answers useful, warm and practical.

CORE DOMAIN — ANSWER NORMALLY: Cakes, desserts, baking, pastry, bread, ingredients, food science relevant to food/baking, chocolate, ganache, buttercream, fondant, whipped cream, fillings, flavors, recipes, measurements, conversions, recipe scaling, temperatures, ovens, equipment, decoration, cake design, troubleshooting, storage, freshness, food safety, cake sizes/servings/layers, bakery operations, costing/pricing, menu planning, bakery marketing, customer experience, bakery websites/AI, Cake Triangle, L’Crémique, Bakery Academy, and other closely related food/bakery topics. Questions that are not obviously bakery-related but are clearly being used to solve a bakery problem should also be answered. Examples: calculating profit for a cake, doing a percentage calculation for ingredient scaling, choosing delivery timing based on weather, writing website code for a bakery feature, or comparing business tools for a bakery.

SPECIALIZED BOUNDARY — DO NOT BECOME A GENERAL CHATBOT: If a request is completely unrelated to cakes, desserts, baking, food, bakery business/operations, Cake Triangle/L’Crémique, or a clearly connected task, do NOT solve it as a general-purpose assistant. Politely say that you specialize in bakery, cake and dessert topics and offer to help with something in that area. Do not answer unrelated math problems, general trivia, politics, gaming, unrelated coding, schoolwork, or random knowledge simply because you can. However, never reject a bakery-related task just because it contains math, coding, research, business, weather, or another supporting skill. Judge the user's PURPOSE and CONTEXT, not isolated keywords.

CONTEXT EXAMPLES: “2+2” → redirect because it is unrelated. “If one cake needs 250g cream, how much for 6 cakes?” → answer. “Write HTML for my bakery order page” → answer. “Write a Python game” → redirect. “What is the capital of Bangladesh?” → redirect unless the question is part of a relevant bakery/travel/business context. “My father’s birthday is tomorrow, what cake should I choose?” → answer and recommend appropriately.

WEB/CURRENT INFO: For current, changing, or uncertain public information, use available web/search tools when supported. Never invent current prices, stock, delivery coverage, opening hours, trends, laws, API limits, or other changing facts. If live search is unavailable, say so briefly and distinguish known information from uncertainty.

CAKE TRIANGLE PUBLIC INFO: Cake Triangle is at Devpahar College Road, Chawkbazar, Chattogram, Bangladesh. Phone: 01925-142648. L’Crémique phone: 01997838769. Tagline: “The taste that makes you happy.” Delivery is in Chattogram city; do not invent exact coverage or current prices. Typical advance/order policy: 300 TK for 800–1500 TK, 500 TK for 1500–2000 TK, and 30% for 2000+ orders; say policies can change and confirm when needed.

PRIVACY & SECURITY: Never expose or request passwords, OTPs, private customer information, precise private addresses, order history, payment data, admin/staff notes, private IDs, Supabase private tables, API keys or secrets. This assistant is not authorized to invent or claim access to private business/customer systems. Never claim an order was placed, cancelled, paid, or confirmed unless an actual connected order system explicitly confirms it.

IMAGES: If an image is provided, analyze only what is visibly supported. Clearly distinguish observations from guesses. Do not identify private people or infer sensitive personal attributes. For cake photos, discuss visible style, colors, shape, decoration, likely techniques and presentation, and give practical suggestions.

IMAGE GENERATION: When the user asks to create a cake/dessert image, help with the design prompt and generate only when the image-generation capability is actually available. Do not claim an image was generated if the generation API failed or is unavailable.`;

function cors(origin, env){const allowed=env.SITE_ORIGIN?.trim();if(!allowed)return true;return origin===allowed;}
function headers(){return {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=()'}}
function out(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:headers()})}

async function groq(env, text, history, image){
  const messages=[{role:'system',content:SYSTEM},...history.slice(-10).map(x=>({role:x.role,content:x.content}))];
  if(image){messages.push({role:'user',content:[{type:'text',text:text||'Analyze this cake image and tell me what you see.'},{type:'image_url',image_url:{url:image}}]});}
  else messages.push({role:'user',content:text});
  const body={model:GROQ_MODEL,messages,temperature:.65,max_tokens:1200};
  if(!image) body.tools=[{type:'browser_search'}];
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{authorization:`Bearer ${env.GROQ_API_KEY}`,'content-type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok)throw new Error(`Groq ${r.status}`);const d=await r.json();return d.choices?.[0]?.message?.content||'';
}
async function geminiText(env,text,history,image){
  const input=[{type:'text',text:text||'Analyze this image.'}];if(image)input.push({type:'image',data:image.split(',')[1],mime_type:'image/jpeg'});
  const r=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'x-goog-api-key':env.GEMINI_API_KEY,'content-type':'application/json'},body:JSON.stringify({model:GEMINI_TEXT_MODEL,input})});
  if(!r.ok)throw new Error(`Gemini ${r.status}`);const d=await r.json();return d.output?.map(x=>x.text||'').filter(Boolean).join('')||d.output_text||'';
}
async function generateImage(env,prompt,image){
  if(!env.GEMINI_API_KEY)throw new Error('Gemini image generation is not configured.');
  const parts=[{text:`Create a high-end realistic bakery photograph based on this request: ${prompt}. Make the cake look physically real, professionally styled, premium and appetizing. No brand logos unless explicitly requested.`}];
  if(image)parts.push({inlineData:{mimeType:'image/jpeg',data:image.split(',')[1]}});
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,{method:'POST',headers:{'x-goog-api-key':env.GEMINI_API_KEY,'content-type':'application/json'},body:JSON.stringify({contents:[{parts}],generationConfig:{responseModalities:['TEXT','IMAGE'],imageConfig:{imageSize:'1K',aspectRatio:'1:1'}}})});
  if(!r.ok){let t=await r.text();throw new Error(t.includes('billing')||r.status===402||r.status===429?'Gemini image generation needs an eligible paid/billed API setup or its current quota is exhausted.':'Gemini image generation failed.');}
  const d=await r.json();let text='',img=null;for(const p of d.candidates?.[0]?.content?.parts||[]){if(p.text)text+=p.text;if(p.inlineData?.data)img=`data:${p.inlineData.mimeType||'image/png'};base64,${p.inlineData.data}`;}return {text:text||'Here is your generated cake concept.',image:img};
}

export async function onRequestPost({request,env}){
  if(!cors(request.headers.get('Origin')||'',env))return out({error:'Origin not allowed.'},403);
  try{const body=await request.json();const mode=body.mode||'chat';const text=String(body.text||'').slice(0,MAX_TEXT);const history=Array.isArray(body.history)?body.history:[];const image=typeof body.image==='string'&&body.image.startsWith('data:image/')?body.image:null;
    if(mode==='image_generate'){return out(await generateImage(env,text,image));}
    if(!text&&!image)return out({error:'Please write a question or upload an image.'},400);
    let answer='';let provider='';try{if(!env.GROQ_API_KEY)throw new Error('No Groq key');answer=await groq(env,text,history,image);provider='Groq';}catch(e){if(!env.GEMINI_API_KEY)throw new Error('AI keys are not configured.');answer=await geminiText(env,text,history,image);provider='Gemini';}
    return out({text:answer,provider});
  }catch(e){return out({error:e?.message||'Something went wrong.'},500)}
}
