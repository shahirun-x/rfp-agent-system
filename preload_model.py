from langchain_community.embeddings.fastembed import FastEmbedEmbeddings

print("⬇ Downloading FastEmbed Model for Build Cache...")
# This line forces the download to happen now
FastEmbedEmbeddings() 
print(" Model downloaded successfully!")