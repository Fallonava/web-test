# Gunakan image resmi n8n
FROM n8nio/n8n:latest

# Set working directory
WORKDIR /data

# Expose port default n8n
EXPOSE 5678

# Jalankan n8n
CMD ["n8n", "start"]
