import os
from dotenv import load_dotenv
from typing import TypedDict, List
from langgraph.graph import StateGraph, END

from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

load_dotenv()

# --- 1. The State (Memory of the conversation) ---
class AgentState(TypedDict):
    question: str
    context: List[str]
    answer: str
    critique: str        # New: Stores the critic's feedback
    revision_count: int  # New: Prevents infinite loops

# --- 2. Setup Resources ---
print(" Loading Memory...")
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_store = FAISS.load_local("rfp_index", embeddings, allow_dangerous_deserialization=True)
retriever = vector_store.as_retriever()

# We use a slightly smarter model for the Critic (optional, but good practice)
llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

# --- 3. The Nodes (The Workers) ---

def retrieve_node(state: AgentState):
    print(f" Searching memory for: {state['question']}")
    docs = retriever.invoke(state["question"])
    context_text = [d.page_content for d in docs]
    return {"context": context_text, "revision_count": 0}

def generate_node(state: AgentState):
    print("  Drafting answer...")
    context_block = "\n".join(state["context"])
    
    # If there is previous critique, we add it to the prompt!
    critique_text = state.get("critique", "None")
    
    prompt = f"""
    You are an expert RFP Analyst. Answer the question based on the context.
    
    Context: {context_block}
    User Question: {state['question']}
    
    Previous Critique (if any): {critique_text}
    
    Answer:
    """
    response = llm.invoke(prompt)
    return {"answer": response.content}

def critique_node(state: AgentState):
    """
    The 'Teacher' node. It checks the work.
    """
    print("  Reviewing answer...")
    
    prompt = f"""
    Review this answer for accuracy and clarity.
    
    User Question: {state['question']}
    Draft Answer: {state['answer']}
    
    If the answer is comprehensive and clear, reply exactly: "APPROVE"
    If it is missing details or vague, reply with specific feedback on what to fix.
    """
    response = llm.invoke(prompt)
    return {"critique": response.content}

# --- 4. The Logic (The Router) ---

def should_continue(state: AgentState):
    """
    Decides: Go to 'End' or Loop back to 'Generate'?
    """
    critique = state["critique"]
    count = state.get("revision_count", 0)
    
    if "APPROVE" in critique:
        print(" Critique passed. Finishing.")
        return END
    elif count >= 2:
        print(" Too many revisions. Stopping to avoid infinite loop.")
        return END
    else:
        print(f" Critique failed: {critique}")
        print(" Looping back to rewrite...")
        return "generate"

# --- 5. Build the Graph ---
workflow = StateGraph(AgentState)

workflow.add_node("retrieve", retrieve_node)
workflow.add_node("generate", generate_node)
workflow.add_node("critique", critique_node)

# Flow: Start -> Retrieve -> Generate -> Critique -> (Decide)
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", "critique")

# Conditional Edge: From Critique, we either go to END or back to Generate
workflow.add_conditional_edges(
    "critique",
    should_continue,
    {
        END: END,
        "generate": "generate"
    }
)

app = workflow.compile()

# --- 6. Run It ---
if __name__ == "__main__":
    query = "Summarize the key requirements mentioned in the document."
    
    print(f"\n Starting Agent for: '{query}'\n")
    # We initialize revision_count to 0
    result = app.invoke({"question": query, "revision_count": 0})
    
    print("\n===  FINAL APPROVED ANSWER ===")
    print(result["answer"])