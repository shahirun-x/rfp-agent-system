import os
from dotenv import load_dotenv
from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END

from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

load_dotenv()

# --- 1. The State ---
class AgentState(TypedDict):
    question: str
    category: str       # New: Stores "TECHNICAL" or "LEGAL"
    answer: str

# --- 2. Setup ---
print(" Loading Memory...")
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_store = FAISS.load_local("rfp_index", embeddings, allow_dangerous_deserialization=True)
retriever = vector_store.as_retriever()

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

# --- 3. The Nodes (Specialists) ---

def router_node(state: AgentState):
    """
    The Traffic Cop. Decides who handles the question.
    """
    print(" Router working...")
    
    # IMPROVED PROMPT: We force it to prioritize "Money/Risk" over "Tech keywords"
    prompt = f"""
    You are a Router. Classify the user's question into exactly one of two categories:
    
    1. LEGAL (Select this if the question mentions cost, price, money, economy, risks, business value, or compliance).
    2. TECHNICAL (Select this ONLY if the question is about how things work, architecture, code, implementation, or tools).

    *CRITICAL INSTRUCTION*: If a question mentions both (e.g., "Cost of agents"), classify it as LEGAL because cost is a business concern.

    Question: {state['question']}

    Return ONLY the word 'TECHNICAL' or 'LEGAL'. Do not add punctuation.
    """
    
    response = llm.invoke(prompt)
    category = response.content.strip().upper()
    
    # Fallback safety
    if "LEGAL" in category: category = "LEGAL"
    elif "TECHNICAL" in category: category = "TECHNICAL"
    else: category = "TECHNICAL"
    
    print(f" Classified as: {category}")
    return {"category": category}

def tech_agent_node(state: AgentState):
    """
    The Engineer. Focuses on 'How it works'.
    """
    print("  Tech Agent activated.")
    # Retrieve context specifically for tech
    docs = retriever.invoke(state["question"])
    context = "\n".join([d.page_content for d in docs])
    
    prompt = f"""
    You are a Technical Architect. Answer using technical terminology (Python, APIs, Nodes).
    Context: {context}
    Question: {state['question']}
    Answer:
    """
    response = llm.invoke(prompt)
    return {"answer": response.content}

def legal_agent_node(state: AgentState):
    """
    The Business Analyst. Focuses on 'Why we do it' and 'Risks'.
    """
    print(" Legal/Business Agent activated.")
    # In a real app, you might search a DIFFERENT vector DB here (e.g., legal_index)
    docs = retriever.invoke(state["question"])
    context = "\n".join([d.page_content for d in docs])
    
    prompt = f"""
    You are a Business Analyst. Answer focusing on value, risks, and costs. Avoid deep code details.
    Context: {context}
    Question: {state['question']}
    Answer:
    """
    response = llm.invoke(prompt)
    return {"answer": response.content}

# --- 4. The Graph Logic ---
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("router", router_node)
workflow.add_node("tech_agent", tech_agent_node)
workflow.add_node("legal_agent", legal_agent_node)

# Entry Point
workflow.set_entry_point("router")

# Conditional Edge (The Fork in the Road)
def decide_route(state: AgentState):
    if state["category"] == "TECHNICAL":
        return "tech_agent"
    else:
        return "legal_agent"

workflow.add_conditional_edges(
    "router",
    decide_route,
    {
        "tech_agent": "tech_agent",
        "legal_agent": "legal_agent"
    }
)

# Connect specialists to END
workflow.add_edge("tech_agent", END)
workflow.add_edge("legal_agent", END)

app = workflow.compile()

# --- 5. Run Test ---
if __name__ == "__main__":
    # Test 1: Technical Question
    q1 = "How does the Vector Database work?"
    print(f"\nUser: {q1}")
    app.invoke({"question": q1})
    
    print("-" * 20)
    
    # Test 2: Business/Legal Question
    q2 = "What are the costs or economic risks of agents?"
    print(f"\nUser: {q2}")
    app.invoke({"question": q2})